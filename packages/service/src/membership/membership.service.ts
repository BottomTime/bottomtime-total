import {
  AccountTier,
  BillingFrequency,
  ListMembershipsResponseDTO,
  MembershipDTO,
  MembershipStatus,
  MembershipStatusDTO,
} from '@bottomtime/api';

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import Stripe from 'stripe';

import { Config } from '../config';
import { User } from '../users';

const ProFeature = 'pro-features';
const ShopOwnerFeature = 'shop-owner-features';

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
  features: Stripe.ProductFeature[];
}[];

@Injectable()
export class MembershipService {
  private readonly log = new Logger(MembershipService.name);

  constructor(@Inject(Stripe) private readonly stripe: Stripe) {}

  private getPriceForAccountTier(accountTier: AccountTier): string {
    switch (accountTier) {
      case AccountTier.Pro:
        return Config.stripe.proMembershipPrice;

      case AccountTier.ShopOwner:
        return Config.stripe.shopOwnerMembershipPrice;

      default:
        throw new BadRequestException(
          `No price registered for account tier: ${accountTier}`,
        );
    }
  }

  // TODO: Is this cache-worthy? Probably.. but is it safe? Will IDs change?
  private async listMembershipProducts(): Promise<ProductsList> {
    this.log.debug('Retrieving membership products...');
    const products = await this.stripe.products.list({
      active: true,
      type: 'service',
      expand: ['data.default_price', 'data.default_price.recurring'],
    });

    this.log.debug(
      'Retrieved',
      products.data.length,
      'products. Attempting to list features...',
    );
    const features = await Promise.all(
      products.data.map((product) =>
        this.stripe.products.listFeatures(product.id),
      ),
    );

    return products.data.map((product, index) => ({
      product,
      features: features[index].data,
    }));
  }

  private async ensureStripeCustomer(user: User): Promise<Stripe.Customer> {
    if (!user.email || !user.emailVerified) {
      throw new ForbiddenException('User must have a verified email address');
    }

    let customer: Stripe.Customer;

    if (user.stripeCustomerId) {
      const returnedCustomer = await this.stripe.customers.retrieve(
        user.stripeCustomerId,
        { expand: ['subscriptions'] },
      );

      if (returnedCustomer.deleted) {
        throw new Error(
          `Stripe customer with ID ${user.stripeCustomerId} was deleted and cannot be retrieved.`,
        );
      }

      customer = returnedCustomer;
    } else {
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
      items: [{ price, quantity: 1 }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  }

  private async changeSubscription(
    customer: Stripe.Customer,
    newAccountTier: AccountTier,
  ): Promise<Stripe.Subscription> {
    const price = this.getPriceForAccountTier(newAccountTier);

    const subscription = customer.subscriptions?.data[0];
    if (!subscription) {
      throw new Error(
        'No subscription found to update. Did you mean to create a subscription?',
      );
    }

    const updated = await this.stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
      items: [{ id: subscription.items.data[0].id, price }],
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
      ...products
        .map((product) => {
          const price = product.product.default_price! as Stripe.Price;
          let accountTier: AccountTier = AccountTier.Basic;

          for (const feature of product.features) {
            if (
              feature.entitlement_feature.lookup_key === ShopOwnerFeature &&
              accountTier < AccountTier.ShopOwner
            ) {
              accountTier = AccountTier.ShopOwner;
            }

            if (
              feature.entitlement_feature.lookup_key === ProFeature &&
              accountTier < AccountTier.Pro
            ) {
              accountTier = AccountTier.Pro;
            }
          }

          const membership: MembershipDTO = {
            accountTier,
            name: product.product.name,
            description: product.product.description ?? undefined,
            marketingFeatures: product.product.marketing_features
              .filter((feature) => !!feature.name)
              .map((feature) => feature.name!),
            price: (price.unit_amount ?? 0) / 100,
            currency: price.currency,
            frequency:
              (price.recurring?.interval as BillingFrequency) ??
              BillingFrequency.Year,
          };

          return membership;
        })
        .sort((a, b) => a.accountTier - b.accountTier),
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
      // Customer was deleted. Default to free tier.
      this.log.debug('Stripe customer was deleted. Defaulting to free tier.');
      return DefaultMembershipStatus;
    }

    this.log.debug('Retrieving customers active entitlements...');
    const entitlementsData =
      await this.stripe.entitlements.activeEntitlements.list({
        customer: user.stripeCustomerId,
      });

    const entitlements: string[] = [];
    let accountTier: AccountTier = AccountTier.Basic;
    for (const entitlement of entitlementsData.data) {
      entitlements.push(entitlement.lookup_key);
      if (
        entitlement.lookup_key === ShopOwnerFeature &&
        accountTier < AccountTier.ShopOwner
      ) {
        accountTier = AccountTier.ShopOwner;
      }

      if (
        entitlement.lookup_key === ProFeature &&
        accountTier < AccountTier.Pro
      ) {
        accountTier = AccountTier.Pro;
      }
    }

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
        entitlements,
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
      entitlements,
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
    // TODO: Perform fulfillment.
    // TODO: Provision new account tier.
    // TODO: Log fulfillment status / payment status. (Database?)
    // TODO: Send an email to the user to confirm thier account status change.
    // TODO: Record/save fulfillment status for this Checkout Session

    if (newAccountTier === AccountTier.Basic) {
      // Cancel an existing membership.
      await this.cancelMembership(user);
    }

    const customer = await this.ensureStripeCustomer(user);

    if (customer.subscriptions?.data.length) {
      // Update the existing subscription.
      await this.changeSubscription(customer, newAccountTier);
    } else {
      // Create a new subscription.
      await this.createNewSubscription(customer, newAccountTier);
    }

    return await this.getMembershipStatus(user);
  }

  async getPaymentSecret(user: User): Promise<string | undefined> {
    if (!user.stripeCustomerId) return undefined;

    const customer = await this.stripe.customers.retrieve(
      user.stripeCustomerId,
      {
        expand: ['subscriptions.data.latest_invoice.payment_intent'],
      },
    );

    if (customer.deleted) return undefined;

    const subscription = customer.subscriptions?.data[0];
    if (!subscription) return undefined;

    const invoice = subscription.latest_invoice;
    if (!invoice || typeof invoice === 'string') return undefined;

    const paymentIntent = invoice.payment_intent;
    if (!paymentIntent || typeof paymentIntent === 'string') return undefined;

    if (!paymentIntent.client_secret) return undefined;

    return paymentIntent.client_secret;
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
      return false;
    }

    const subscription = customer.subscriptions?.data[0];
    if (!subscription) {
      this.log.debug('Stripe customer has no subscriptions to cancel.');
      return false;
    }

    this.log.debug(
      `Cancelling subscription "${subscription.id}" for user "${user.username}"`,
    );
    await this.stripe.subscriptions.cancel(subscription.id);

    this.log.log(
      `Subscription (${subscription.id}) has been cancelled for user "${user.username}".`,
    );

    // TODO: Send a confirmation email to the user.

    return true;
  }

  parseWebhookEvent(payload: string, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      Config.stripe.sdkKey,
    );
  }
}
