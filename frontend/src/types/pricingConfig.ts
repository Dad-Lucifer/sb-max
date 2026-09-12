export interface DevicePricesPS5 {
    onePerson: number;
    twoPerson?: number;
    multiplePersonBaseMod: number;
    extra30mMod: number;
    less30m?: number;
    onePersonBase?: number; // legacy support if needed
}

export interface DevicePricesPC {
    base: number;
    twoPerson?: number;
    extra30m: number;
    less30m?: number;
    hourRateIfMoreThan3h?: number;
    multiplePersonBaseMod?: number;
}

export interface DevicePricesWheel {
    base: number;
    less30m: number;
    extra30m: number;
    extra60m?: number;
    multiplePersonBaseMod?: number;
}

export interface PriceMatrix {
    ps5: DevicePricesPS5;
    pc?: DevicePricesPC;
    wheel?: DevicePricesWheel;
}

export interface DaySlotPrices {
    happyHour: PriceMatrix;
    normalHour: PriceMatrix;
    funNight: PriceMatrix;
}

export interface PricingConfig {
    happyHour: {
        monWedStartHour: number; monWedStartMinute: number; monWedEndHour: number; monWedEndMinute: number;
        thursdayStartHour: number; thursdayStartMinute: number; thursdayEndHour: number; thursdayEndMinute: number;
        friSunStartHour: number; friSunStartMinute: number; friSunEndHour: number; friSunEndMinute: number;
    };
    normalHour: {
        monWedStartHour: number; monWedStartMinute: number; monWedEndHour: number; monWedEndMinute: number;
        thursdayStartHour: number; thursdayStartMinute: number; thursdayEndHour: number; thursdayEndMinute: number;
        friSunStartHour: number; friSunStartMinute: number; friSunEndHour: number; friSunEndMinute: number;
    };
    funNight: { startHour: number; startMinute: number; endHour: number; endMinute: number; };

    vr?: { hour: number; first15m: number; first30m: number; remaining: number; };
    metabat?: { hour: number; first15m: number; first30m: number; remaining: number; };

    // New 3-zone pricing
    monWedPrices: DaySlotPrices;
    thursdayPrices: DaySlotPrices;
    friSunPrices: DaySlotPrices;

    fallback: { hourRate: number; };
}

export const defaultPricingConfig: PricingConfig = {
    happyHour: {
        monWedStartHour: 9, monWedStartMinute: 0, monWedEndHour: 13, monWedEndMinute: 45,
        thursdayStartHour: 9, thursdayStartMinute: 0, thursdayEndHour: 11, thursdayEndMinute: 45,
        friSunStartHour: 9, friSunStartMinute: 0, friSunEndHour: 11, friSunEndMinute: 45
    },
    normalHour: {
        monWedStartHour: 13, monWedStartMinute: 45, monWedEndHour: 20, monWedEndMinute: 45,
        thursdayStartHour: 11, thursdayStartMinute: 45, thursdayEndHour: 20, thursdayEndMinute: 45,
        friSunStartHour: 11, friSunStartMinute: 45, friSunEndHour: 20, friSunEndMinute: 45
    },
    funNight: { startHour: 20, startMinute: 45, endHour: 6, endMinute: 0 },

    monWedPrices: {
        happyHour: {
            ps5: { less30m: 40, onePerson: 120, twoPerson: 170, multiplePersonBaseMod: 50, extra30mMod: 60 }
        },
        normalHour: {
            ps5: { less30m: 60, onePerson: 120, twoPerson: 170, multiplePersonBaseMod: 50, extra30mMod: 60 }
        },
        funNight: {
            ps5: { less30m: 50, onePerson: 100, twoPerson: 150, multiplePersonBaseMod: 50, extra30mMod: 50 }
        }
    },
    thursdayPrices: {
        happyHour: {
            ps5: { less30m: 40, onePerson: 120, twoPerson: 170, multiplePersonBaseMod: 50, extra30mMod: 60 }
        },
        normalHour: {
            ps5: { less30m: 60, onePerson: 120, twoPerson: 170, multiplePersonBaseMod: 50, extra30mMod: 60 }
        },
        funNight: {
            ps5: { less30m: 50, onePerson: 100, twoPerson: 150, multiplePersonBaseMod: 50, extra30mMod: 50 }
        }
    },
    friSunPrices: {
        happyHour: {
            ps5: { less30m: 40, onePerson: 120, twoPerson: 170, multiplePersonBaseMod: 50, extra30mMod: 60 }
        },
        normalHour: {
            ps5: { less30m: 60, onePerson: 120, twoPerson: 170, multiplePersonBaseMod: 50, extra30mMod: 60 }
        },
        funNight: {
            ps5: { less30m: 50, onePerson: 100, twoPerson: 150, multiplePersonBaseMod: 50, extra30mMod: 50 }
        }
    },

    fallback: { hourRate: 50 }
};
