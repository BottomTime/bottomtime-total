/**
 * @openapi
 * components:
 *   schemas:
 *     Membership:
 *       type: object
 *       required:
 *         - accountTier
 *         - name
 *         - price
 *         - currency
 *         - frequency
 *       properties:
 *         accountTier:
 *           title: Account Tier
 *           type: number
 *           format: int32
 *           enum:
 *             - 0
 *             - 100
 *             - 200
 *           description: |
 *             The account tier associated with the user's subscription.
 *             - `0` - Free tier
 *             - `100` - Pro tier
 *             - `200` - Shop Owner tier
 *           example: 100
 *         name:
 *           title: Name
 *           type: string
 *           description: The name of the membership tier.
 *           example: Pro Membership
 *         description:
 *           title: Description
 *           type: string
 *           description: A description of the membership tier.
 *           example: Access to all premium features.
 *         marketingFeatures:
 *           title: Marketing Features
 *           type: array
 *           items:
 *             type: string
 *           description: |
 *             A list of features that are included in the membership tier for marketing purposes.
 *           example:
 *             - Feature 1
 *             - Feature 2
 *         price:
 *           title: Price
 *           type: number
 *           description: The price of the membership tier.
 *           example: 39.99
 *         currency:
 *           title: Currency
 *           type: string
 *           description: The currency code for the membership tier.
 *           example: cad
 *         frequency:
 *           title: Frequency
 *           type: string
 *           enum:
 *             - day
 *             - week
 *             - month
 *             - year
 *           description: The billing frequency for the membership tier.
 *           example: year
 *     MembershipStatus:
 *       type: object
 *       required:
 *         - accountTier
 *         - entitlements
 *         - status
 *       properties:
 *         accountTier:
 *           title: Account Tier
 *           type: number
 *           format: int32
 *           enum:
 *             - 0
 *             - 100
 *             - 200
 *           description: |
 *             The account tier associated with the user's membership.
 *             - `0` - Free tier
 *             - `100` - Pro tier
 *             - `200` - Shop Owner tier
 *           example: 100
 *         entitlements:
 *           title: Entitlements
 *           type: array
 *           items:
 *             type: string
 *           description: |
 *             A list of features that are included in the user's subscription. Note, that the user
 *             will not have access to these features if the membership status is not one of `active` or `trialing`.
 *           example:
 *             - Feature 1
 *             - Feature 2
 *         status:
 *           title: Status
 *           type: string
 *           enum:
 *             - none
 *             - incomplete
 *             - expired
 *             - trialing
 *             - active
 *             - pastDue
 *             - canceled
 *             - unpaid
 *             - paused
 *           description: The current status of the user's subscription.
 *           example: active
 *         cancellationDate:
 *           title: Cancellation Date
 *           type: string
 *           format: date-time
 *           description: The date and time at which this membership will be cancelled.
 *           example: 2021-07-01T12:00:00Z
 *         trialEndDate:
 *           title: Trial End Date
 *           type: string
 *           format: date-time
 *           description: |
 *             The date and time at which the user's trial period will end. After this,
 *             the membership status will transition from `trialing` to `active` and the user will
 *             be charged for their first year.
 *           example: 2021-07-01T12:00:00Z
 *         nextBillingDate:
 *           title: Next Billing Date
 *           type: string
 *           format: date-time
 *           description: The date and time at which the user will be billed for their next subscription period.
 *           example: 2022-07-01T12:00:00Z
 */
