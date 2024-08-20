/* eslint-disable no-console */
import { Stripe } from 'stripe';

export async function initProducts(sdkKey: string) {
  try {
    const stripe = new Stripe(sdkKey);

    // Create products and features
    console.log('Creating products and features...');
    const [proMembership, shopOwnerMembership, proFeatures, shopOwnerFeatures] =
      await Promise.all([
        stripe.products.create({
          name: 'Pro Membership',
          description:
            'Get all of the features of a free account plus some added benefits:',
          active: true,
          default_price_data: {
            currency: 'cad',
            unit_amount: 4000, // $40.00
            recurring: {
              interval: 'year',
              interval_count: 1,
            },
            tax_behavior: 'exclusive',
          },
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
          default_price_data: {
            currency: 'cad',
            unit_amount: 10000, // $100.00
            recurring: {
              interval: 'year',
              interval_count: 1,
            },
            tax_behavior: 'exclusive',
          },
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

        stripe.entitlements.features.create({
          name: 'Pro Membership Features',
          lookup_key: 'pro-features',
        }),
        stripe.entitlements.features.create({
          name: 'Shop Owner Membership Features',
          lookup_key: 'shop-owner-features',
        }),
      ]);

    // Bind features to products
    console.log('Binding features to products...');
    await Promise.all([
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

    const result = {
      proMembership: {
        productId: proMembership.id,
        priceId: proMembership.default_price,
      },
      shopOwnerMembership: {
        productId: shopOwnerMembership.id,
        priceId: shopOwnerMembership.default_price,
      },
    };

    console.log('Operation completed successfully!');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
