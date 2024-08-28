/* eslint-disable no-console */
import { Stripe } from 'stripe';

export async function initProducts(sdkKey: string) {
  try {
    const stripe = new Stripe(sdkKey);

    console.log('Creating products and features...');
    const [proMembership, shopOwnerMembership, proFeatures, shopOwnerFeatures] =
      await Promise.all([
        // Products...
        stripe.products.create({
          name: 'Pro Membership',
          description:
            'Get all of the features of a free account plus some added benefits:',
          active: true,
          marketing_features: [
            {
              name: 'Add images and videos to your dive log entries',
            },
            {
              name: 'Get advanced metrics with our enhanced dashboard for pro users',
            },
            {
              name: 'Get a "Pro Diver" badge next to your username',
            },
            {
              name: 'Earn XP faster than with a free account',
            },
          ],
          tax_code: 'txcd_10103000', // SaaS - personal use
        }),
        stripe.products.create({
          name: 'Shop Owner Membership',
          description:
            'Get all of the benefits of a pro account, plus the ability to register and manage your dive shop on our site.',
          active: true,
          marketing_features: [
            {
              name: "Register and manage your shop's profile",
            },
            {
              name: 'Reach new divers by having your shop appear in search results',
            },
            {
              name: 'Tag dive sites that your shop services to attract more customers',
            },
          ],
          tax_code: 'txcd_10103001', // SaaS - business use
        }),

        // Features...
        stripe.entitlements.features.create({
          name: 'Pro Membership Features',
          lookup_key: 'pro-features',
        }),
        stripe.entitlements.features.create({
          name: 'Shop Owner Membership Features',
          lookup_key: 'shop-owner-features',
        }),
      ]);

    console.log('Binding features and prices to products...');
    await Promise.all([
      // Prices...
      stripe.prices.create({
        product: proMembership.id,
        currency: 'cad',
        unit_amount: 4000, // $40.00
        recurring: {
          interval: 'year',
          interval_count: 1,
        },
        tax_behavior: 'exclusive',
        lookup_key: 'pro-membership-yearly',
      }),
      stripe.prices.create({
        product: shopOwnerMembership.id,
        currency: 'cad',
        unit_amount: 10000, // $100.00
        recurring: {
          interval: 'year',
          interval_count: 1,
        },
        tax_behavior: 'exclusive',
        lookup_key: 'shop-owner-membership-yearly',
      }),

      // Features...
      stripe.products.createFeature(proMembership.id, {
        entitlement_feature: proFeatures.id,
      }),
      stripe.products.createFeature(shopOwnerMembership.id, {
        entitlement_feature: proFeatures.id,
      }),
      stripe.products.createFeature(shopOwnerMembership.id, {
        entitlement_feature: shopOwnerFeatures.id,
      }),
    ]);

    console.log('Operation completed successfully!');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
