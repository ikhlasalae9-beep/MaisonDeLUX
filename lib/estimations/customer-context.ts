export function customerContext<T extends Record<string,any>|null|undefined>(context:T){
  if(!context?.market_context)return context;
  const {minimum_observations:_internalThreshold,...marketContext}=context.market_context;
  return {...context,market_context:marketContext};
}
