import { AccountTier } from '@bottomtime/api';

// TODO: Make this configurable.
export const Prices = {
  proSubscription: 'price_1PlZURI1ADsIvyhFO0hjSMcD',
  shopOwnerSubscription: 'price_1PlZVGI1ADsIvyhFVjRgclNp',
} as const;

export const Products = {
  prod_Qcp8aEmUUcEc6Z: AccountTier.Pro,
  prod_Qcp95G7AaZTfrL: AccountTier.ShopOwner,
} as const;
