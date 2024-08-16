import { AccountTier } from '@bottomtime/api';

// TODO: Make this configurable.
export const Prices: Record<AccountTier, string> = {
  [AccountTier.Basic]: '',
  [AccountTier.Pro]: 'price_1PlZURI1ADsIvyhFO0hjSMcD',
  [AccountTier.ShopOwner]: 'price_1PlZVGI1ADsIvyhFVjRgclNp',
} as const;

export const Products = {
  prod_Qcp8aEmUUcEc6Z: AccountTier.Pro,
  prod_Qcp95G7AaZTfrL: AccountTier.ShopOwner,
} as const;
