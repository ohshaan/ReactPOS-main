import { createSelector } from "reselect";

const selectPayState = (state) => state.pay;

export const selectSlabData = createSelector(
	[selectPayState],
	(pay) => pay.slab
);
