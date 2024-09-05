import {
  AccountTier,
  BillingFrequency,
  ListMembershipsResponseDTO,
  MembershipDTO,
  MembershipStatus,
  MembershipStatusDTO,
  PaymentSessionDTO,
} from '@bottomtime/api';

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';

import Stripe from 'stripe';

import { User } from '../users';
import {
  ProFeature,
  ProMembershipYearlyPrice,
  ShopOwnerFeature,
  ShopOwnerMembershipYearlyPrice,
} from './constants';

const SubscriptionStatusMap: Record<
  Stripe.Subscription.Status,
  MembershipStatus
> = {
  active: MembershipStatus.Active,
  canceled: MembershipStatus.Canceled,
  incomplete: MembershipStatus.Incomplete,
  incomplete_expired: MembershipStatus.Expired,
  past_due: MembershipStatus.PastDue,
  paused: MembershipStatus.Paused,
  trialing: MembershipStatus.Trialing,
  unpaid: MembershipStatus.Unpaid,
} as const;

const DefaultMembershipStatus: MembershipStatusDTO = {
  accountTier: AccountTier.Basic,
  status: MembershipStatus.None,
  entitlements: [],
} as const;

type ProductsList = {
  product: Stripe.Product;
  price: Stripe.Price;
  features: Set<string>;
}[];

const InitError = new Error(
  'Price or product information is not available. Did you call onModuleInit()? Are the prices and products correctly registered in Stripe?',
);

@Injectable()
export class MembershipService implements OnModuleInit {
  private readonly log = new Logger(MembershipService.name);

  private _proMemberhsip: Stripe.Product | undefined;
  private _proMembershipPrice: Stripe.Price | undefined;

  private _shopOwnerMembership: Stripe.Product | undefined;
  private _shopOwnerMembershipPrice: Stripe.Price | undefined;

  private readonly priceMap: Record<AccountTier, Stripe.Price | null>;

  constructor(@Inject(Stripe) private readonly stripe: Stripe) {
    this.priceMap = {
      [AccountTier.Basic]: null,
      [AccountTier.Pro]: null,
      [AccountTier.ShopOwner]: null,
    };
  }

  /** Request and cache price/product information on our membership tiers from Stripe. */
  async onModuleInit(): Promise<void> {
    this.log.debug('Retrieving prices and products from Stripe...');
    try {
      const { data: prices } = await this.stripe.prices.list({
        lookup_keys: [ProMembershipYearlyPrice, ShopOwnerMembershipYearlyPrice],
        expand: ['data.product'],
      });

      prices.forEach((price) => {
        if (price.lookup_key === ProMembershipYearlyPrice) {
          this._proMembershipPrice = price;
          this._proMemberhsip = price.product as Stripe.Product;
        }

        if (price.lookup_key === ShopOwnerMembershipYearlyPrice) {
          this._shopOwnerMembershipPrice = price;
          this._shopOwnerMembership = price.product as Stripe.Product;
        }
      });

      this.priceMap[AccountTier.Pro] = this.proMembershipPrice;
      this.priceMap[AccountTier.ShopOwner] = this.shopOwnerMembershipPrice;
    } catch (error) {
      this.log.error(error);
    }
  }

  private get proMemberhsip(): Stripe.Product {
    if (!this._proMemberhsip) throw InitError;
    return this._proMemberhsip;
  }

  private get proMembershipPrice(): Stripe.Price {
    if (!this._proMembershipPrice) throw InitError;
    return this._proMembershipPrice;
  }

  private get shopOwnerMembership(): Stripe.Product {
    if (!this._shopOwnerMembership) throw InitError;
    return this._shopOwnerMembership;
  }

  private get shopOwnerMembershipPrice(): Stripe.Price {
    if (!this._shopOwnerMembershipPrice) throw InitError;
    return this._shopOwnerMembershipPrice;
  }

  private listMembershipProducts(): ProductsList {
    return [
      {
        product: this.proMemberhsip,
        price: this.proMembershipPrice,
        features: new Set([ProFeature]),
      },
      {
        product: this.shopOwnerMembership,
        price: this.shopOwnerMembershipPrice,
        features: new Set([ProFeature, ShopOwnerFeature]),
      },
    ];
  }

  private getPriceForAccountTier(accountTier: AccountTier): Stripe.Price {
    const price = this.priceMap[accountTier];
    if (!price) {
      throw new BadRequestException(
        `No price information available for account tier: ${accountTier}`,
      );
    }

    return price;
  }

  private async ensureStripeCustomer(user: User): Promise<Stripe.Customer> {
    let customer: Stripe.Customer;

    if (user.stripeCustomerId) {
      const returnedCustomer = await this.stripe.customers.retrieve(
        user.stripeCustomerId,
        { expand: ['subscriptions'] },
      );

      if (returnedCustomer.deleted) {
        // TODO: Should we provision a new Stripe customer here?? Might not be the safest thing to do.
        throw new InternalServerErrorException(
          `Stripe customer with ID ${user.stripeCustomerId} was deleted and cannot be retrieved.`,
        );
      }

      customer = returnedCustomer;
    } else {
      if (!user.email || !user.emailVerified) {
        throw new ForbiddenException('User must have a verified email address');
      }

      this.log.debug(
        `No Stripe customer associated with user "${user.username}". Creating one...`,
      );
      customer = await this.stripe.customers.create({
        email: user.email,
        name: user.profile.name,
      });
      await user.attachStripeCustomerId(customer.id);
    }

    return customer;
  }

  private async createNewSubscription(
    customer: Stripe.Customer,
    accountTier: AccountTier,
  ): Promise<Stripe.Subscription> {
    const price = this.getPriceForAccountTier(accountTier);
    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id, quantity: 1 }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      collection_method: 'charge_automatically',
      proration_behavior: 'create_prorations',
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  }

  private async changeSubscription(
    customer: Stripe.Customer,
    newAccountTier: AccountTier,
  ): Promise<Stripe.Subscription> {
    const price = this.getPriceForAccountTier(newAccountTier);
    const subscription = customer.subscriptions!.data[0];
    const updated = await this.stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
      proration_behavior: 'create_prorations',
      items: [{ id: subscription.items.data[0].id, price: price.id }],
    });

    return updated;
  }

  async listMemberships(): Promise<ListMembershipsResponseDTO> {
    const products = await this.listMembershipProducts();
    const memberships = [
      {
        accountTier: AccountTier.Basic,
        name: 'Free Account',
        description:
          'Get all of the features of BottomTime for personal use - for free!',
        marketingFeatures: [
          'Upload and log your dives',
          'Track your dive metrics and history in your personal dashboard',
          'Find dive sites and dive shops',
          'Follow your dive buddies and',
          'Earn XP and level up',
        ],
        price: 0,
        currency: 'cad',
        frequency: BillingFrequency.Year,
      },
      ...products.map((entry) => {
        let accountTier: AccountTier = AccountTier.Basic;
        if (entry.features.has(ProFeature)) accountTier = AccountTier.Pro;
        if (entry.features.has(ShopOwnerFeature))
          accountTier = AccountTier.ShopOwner;

        const membership: MembershipDTO = {
          accountTier,
          name: entry.product.name,
          description: entry.product.description ?? undefined,
          marketingFeatures: entry.product.marketing_features
            .filter((feature) => !!feature.name)
            .map((feature) => feature.name!),
          price: (entry.price.unit_amount ?? 0) / 100,
          currency: entry.price.currency,
          frequency:
            (entry.price.recurring?.interval as BillingFrequency) ??
            BillingFrequency.Year,
        };

        return membership;
      }),
    ];

    return memberships;
  }

  async getMembershipStatus(user: User): Promise<MembershipStatusDTO> {
    this.log.debug(
      'Attempting to retrieve membership for user: ',
      user.username,
    );

    if (!user.stripeCustomerId) {
      // No Stripe customer. Default to free tier.
      this.log.debug(
        'User has no Stripe customer ID. Defaulting to free tier.',
      );
      return DefaultMembershipStatus;
    }

    const customer = await this.stripe.customers.retrieve(
      user.stripeCustomerId,
      {
        expand: ['subscriptions'],
      },
    );

    this.log.debug('Retrieved customer: ', customer.id);

    if (customer.deleted) {
      // Customer was deleted. Default to free tier. (Ideally, customers should only be deleted from Stripe if
      // the corresponding user is also removed from our database!)
      this.log.debug('Stripe customer was deleted. Defaulting to free tier.');
      return DefaultMembershipStatus;
    }

    this.log.debug('Retrieving customers active entitlements...');
    const entitlementsData =
      await this.stripe.entitlements.activeEntitlements.list({
        customer: user.stripeCustomerId,
      });

    const entitlements = new Set<string>(
      entitlementsData.data.map((e) => e.lookup_key),
    );
    let accountTier: AccountTier = AccountTier.Basic;
    if (entitlements.has(ProFeature)) accountTier = AccountTier.Pro;
    if (entitlements.has(ShopOwnerFeature)) accountTier = AccountTier.ShopOwner;

    this.log.debug(
      'Retrieved active entitlements: ',
      entitlements,
      'Determined account tier: ',
      accountTier,
    );

    if (!customer.subscriptions?.data.length) {
      // No subscriptions. Default to free tier.
      this.log.warn(
        'Customer has no subscription data. Returning account tier from entitlements but unable to get subscription info.',
      );
      return {
        accountTier,
        entitlements: entitlementsData.data.map((e) => e.lookup_key),
        status: MembershipStatus.None,
      };
    }

    const subscription = customer.subscriptions.data[0];
    const status = SubscriptionStatusMap[subscription.status];
    this.log.debug(
      'Retrieved subscription status: ',
      subscription.status,
      'from subscription: ',
      subscription.id,
    );

    return {
      accountTier,
      cancellationDate: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : undefined,
      entitlements: entitlementsData.data.map((e) => e.lookup_key),
      nextBillingDate: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : undefined,
      status,
      trialEndDate: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : undefined,
    };
  }

  async updateMembership(
    user: User,
    newAccountTier: AccountTier,
  ): Promise<MembershipStatusDTO> {
    if (user.accountTier === newAccountTier) {
      // No change needed. This is a no-op.
      return await this.getMembershipStatus(user);
    }

    if (newAccountTier === AccountTier.Basic) {
      // Cancel an existing membership.
      await this.cancelMembership(user);
      await user.changeMembership(AccountTier.Basic);
      return await this.getMembershipStatus(user);
    }

    const customer = await this.ensureStripeCustomer(user);

    if (customer.subscriptions?.data.length) {
      // Update the existing subscription.
      await this.changeSubscription(customer, newAccountTier);
    } else {
      // Create a new subscription.
      await this.createNewSubscription(customer, newAccountTier);
    }

    const updated = await this.getMembershipStatus(user);
    if (
      updated.status === MembershipStatus.Active ||
      updated.status === MembershipStatus.Trialing
    ) {
      await user.changeMembership(newAccountTier);
    }

    this.log.log(
      `Updated membership for user "${user.username}". New account tier is: ${newAccountTier}`,
    );

    return updated;
  }

  async createPaymentSession(
    user: User,
  ): Promise<PaymentSessionDTO | undefined> {
    if (!user.stripeCustomerId) return undefined;

    const customer = await this.stripe.customers.retrieve(
      user.stripeCustomerId,
      {
        expand: [
          'subscriptions.data.latest_invoice.payment_intent',
          'subscriptions.data.latest_invoice.total_discount_amounts',
          'subscriptions.data.items',
        ],
      },
    );

    if (customer.deleted) {
      throw new InternalServerErrorException(
        `Stripe customer "${user.stripeCustomerId}" was deleted. Associated with user "${user.username}".`,
      );
    }

    const subscription = customer.subscriptions?.data[0];
    if (!subscription) return undefined;

    const item = subscription.items.data[0];
    let product: Stripe.Product | undefined;
    if (item.price.id === this.proMembershipPrice.id) {
      product = this.proMemberhsip;
    } else if (item.price.id === this.shopOwnerMembershipPrice.id) {
      product = this.shopOwnerMembership;
    }

    if (!product) return undefined;

    const invoice = subscription.latest_invoice;
    if (!invoice || typeof invoice === 'string') return undefined;

    const paymentIntent = invoice.payment_intent;
    if (!paymentIntent || typeof paymentIntent === 'string') return undefined;

    if (!paymentIntent.client_secret) return undefined;

    return {
      clientSecret: paymentIntent.client_secret,
      currency: invoice.currency,
      frequency: item.price.recurring?.interval as BillingFrequency,
      products: [
        {
          price: (item.price.unit_amount ?? 0) / 100,
          product: product.name,
        },
      ],
      discounts:
        invoice.total_discount_amounts?.reduce(
          (acc, discount) => acc + discount.amount / 100,
          0,
        ) || undefined,
      tax: invoice.tax ? invoice.tax / 100 : undefined,
      total: invoice.total / 100,
    };
  }

  async cancelMembership(user: User): Promise<boolean> {
    if (!user.stripeCustomerId) {
      this.log.debug(
        'User has no Stripe customer ID. No subscription to cancel.',
      );
      return false;
    }

    const customer = await this.stripe.customers.retrieve(
      user.stripeCustomerId,
      { expand: ['subscriptions'] },
    );

    if (customer.deleted) {
      this.log.debug('Stripe customer was deleted. No subscription to cancel.');
      throw new InternalServerErrorException(
        `Stripe customer was deleted: "${user.stripeCustomerId}". Associated with user account "${user.username}".`,
      );
    }

    const subscription = customer.subscriptions?.data[0];
    if (!subscription) {
      this.log.debug('Stripe customer has no subscriptions to cancel.');
      return false;
    }

    this.log.debug(
      `Cancelling subscription "${subscription.id}" for user "${user.username}"`,
    );
    await this.stripe.subscriptions.cancel(subscription.id, {
      prorate: true, // Make sure the user is refunded for the portion of the subscription they did not use.
      invoice_now: true,
    });
    await user.changeMembership(AccountTier.Basic);

    this.log.log(
      `Subscription (${subscription.id}) has been cancelled for user "${user.username}".`,
    );

    return true;
  }
}
