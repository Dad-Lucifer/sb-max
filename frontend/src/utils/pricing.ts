import type { PricingConfig } from '../types/pricingConfig';
import { defaultPricingConfig } from '../types/pricingConfig';

export const isHappyHourTime = (date: Date = new Date(), config: PricingConfig = defaultPricingConfig): boolean => {
    const day = date.getDay(); // 0 = Sun, 6 = Sat
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const check = config.happyHour;

    const isMonWed = day >= 1 && day <= 3;
    const isThursday = day === 4;
    const isFriSun = day === 5 || day === 6 || day === 0;

    if (isMonWed) {
        if (hours < check.monWedStartHour) return false;
        if (hours < check.monWedEndHour) return true;
        if (hours === check.monWedEndHour) return minutes < check.monWedEndMinute;
        return false;
    }

    if (isThursday) {
        if (hours < check.thursdayStartHour) return false;
        if (hours < check.thursdayEndHour) return true;
        if (hours === check.thursdayEndHour) return minutes < check.thursdayEndMinute;
        return false;
    }

    if (isFriSun) {
        if (hours < check.friSunStartHour) return false;
        if (hours < check.friSunEndHour) return true;
        if (hours === check.friSunEndHour) return minutes < check.friSunEndMinute;
        return false;
    }

    return false;
};


export const isFunNightTime = (date: Date = new Date(), config: PricingConfig = defaultPricingConfig): boolean => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const check = config.funNight;

    // e.g. 20:45 to 6:00
    if (check.startHour > check.endHour) {
        return hours > check.startHour || (hours === check.startHour && minutes >= check.startMinute) || hours < check.endHour || (hours === check.endHour && minutes < check.endMinute);
    } else {
        return (hours > check.startHour || (hours === check.startHour && minutes >= check.startMinute)) && (hours < check.endHour || (hours === check.endHour && minutes < check.endMinute));
    }
};


export const isNormalHourTime = (date: Date = new Date(), config: PricingConfig = defaultPricingConfig): boolean => {
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const isMonWed = day >= 1 && day <= 3;
    const isThursday = day === 4;
    const isFriSun = day === 5 || day === 6 || day === 0;

    const check = config.normalHour;

    // First check if it's Fun Night, because Fun Night overrides Normal Hour at night
    if (isFunNightTime(date, config)) return false;

    if (isMonWed) {
        if (hours > check.monWedStartHour && hours < check.monWedEndHour) return true;
        if (hours === check.monWedStartHour && hours === check.monWedEndHour) return minutes >= check.monWedStartMinute && minutes < check.monWedEndMinute;
        if (hours === check.monWedStartHour) return minutes >= check.monWedStartMinute;
        if (hours === check.monWedEndHour) return minutes < check.monWedEndMinute;
        return false;
    } else if (isThursday) {
        if (hours > check.thursdayStartHour && hours < check.thursdayEndHour) return true;
        if (hours === check.thursdayStartHour && hours === check.thursdayEndHour) return minutes >= check.thursdayStartMinute && minutes < check.thursdayEndMinute;
        if (hours === check.thursdayStartHour) return minutes >= check.thursdayStartMinute;
        if (hours === check.thursdayEndHour) return minutes < check.thursdayEndMinute;
        return false;
    } else if (isFriSun) {
        // Fri-Sun
        if (hours > check.friSunStartHour && hours < check.friSunEndHour) return true;
        if (hours === check.friSunStartHour && hours === check.friSunEndHour) return minutes >= check.friSunStartMinute && minutes < check.friSunEndMinute;
        if (hours === check.friSunStartHour) return minutes >= check.friSunStartMinute;
        if (hours === check.friSunEndHour) return minutes < check.friSunEndMinute;
        return false;
    }
    return false;
};

export const calculateSessionPrice = (
    durationHours: number,
    peopleCount: number,
    devices: { [key: string]: number | number[] | undefined },
    startTime: Date = new Date(),
    config: PricingConfig = defaultPricingConfig
): number => {
    const durationMinutes = durationHours * 60;

    const getDeviceIds = (val: number | number[] | undefined): number[] => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'number' && val > 0) return [val];
        return [];
    };

    const psIds = getDeviceIds(devices.ps);
    const pcIds = getDeviceIds(devices.pc);
    const vrIds = getDeviceIds(devices.vr);
    const wheelIds = getDeviceIds(devices.wheel);
    const metabatIds = getDeviceIds(devices.metabat);

    const numPS = psIds.length;
    const numPC = pcIds.length;
    const numVR = vrIds.length;
    const numWheel = wheelIds.length;
    const numMetaBat = metabatIds.length;

    let grandTotal = 0;

    const baseAssigned = numPC + numVR + numWheel + numMetaBat + numPS;
    let extraPeople = Math.max(0, peopleCount - baseAssigned);

    let extraOnPS = 0;
    let extraOnPC = 0;

    if (numPS > 0) {
        extraOnPS = extraPeople;
    } else if (numPC > 0) {
        extraOnPC = extraPeople;
    }

    const totalPeopleOnPS = numPS > 0 ? numPS + extraOnPS : 0;
    const totalPeopleOnPC = numPC > 0 ? numPC + extraOnPC : 0;

    const psDistribution: number[] = [];
    if (numPS > 0) {
        if (totalPeopleOnPS === 0) {
            for (let i = 0; i < numPS; i++) psDistribution.push(0);
        } else {
            const base = Math.floor(totalPeopleOnPS / numPS);
            const remainder = totalPeopleOnPS % numPS;
            for (let i = 0; i < numPS; i++) {
                psDistribution.push(i < remainder ? base + 1 : base);
            }
        }
    }

    const pcDistribution: number[] = [];
    if (numPC > 0) {
        if (totalPeopleOnPC === 0) {
            for (let i = 0; i < numPC; i++) pcDistribution.push(0);
        } else if (totalPeopleOnPC === 2 && numPC === 2) {
            // Group 2 players on 2 PCs into a single '2-person' block to trigger the twoPerson bundle price
            pcDistribution.push(2);
        } else {
            const base = Math.floor(totalPeopleOnPC / numPC);
            const remainder = totalPeopleOnPC % numPC;
            for (let i = 0; i < numPC; i++) {
                pcDistribution.push(i < remainder ? base + 1 : base);
            }
        }
    }

    const day = startTime.getDay();
    const isMonWed = day >= 1 && day <= 3;
    const isThursday = day === 4;

    const dayPrices = isMonWed ? config.monWedPrices : (isThursday ? config.thursdayPrices : config.friSunPrices);
    const { vr: vrConf, metabat: metabatConf } = config;
    const hhConf = dayPrices.happyHour;
    const nhConf = dayPrices.normalHour;
    const fnConf = dayPrices.funNight;

    const getPriceForSpecs = (conf: { hour: number; first15m: number; first30m: number; remaining: number }, pCount: number) => {
        if (pCount === 0) return 0;
        let rate = 0;
        const fullHours = Math.floor(durationMinutes / 60);
        rate += fullHours * conf.hour;

        const remainingMinutes = durationMinutes % 60;
        if (remainingMinutes > 0 && remainingMinutes <= 15) {
            rate += conf.first15m;
        } else if (remainingMinutes > 15 && remainingMinutes <= 30) {
            rate += conf.first30m;
        } else if (remainingMinutes > 30 && remainingMinutes < 60) {
            rate += conf.remaining;
        }

        return rate * pCount;
    };

    grandTotal += numVR * getPriceForSpecs(vrConf, 1);
    grandTotal += numMetaBat * getPriceForSpecs(metabatConf || vrConf, 1);

    const isHappy = isHappyHourTime(startTime, config);
    const isNormal = isNormalHourTime(startTime, config);
    const isFun = isFunNightTime(startTime, config);

    // 1️⃣ HAPPY HOUR
    if (isHappy) {
        psDistribution.forEach((p: number) => {
            if (p === 0) return;
            const baseCost = p === 1 ? hhConf.ps5.onePerson : (p === 2 && hhConf.ps5.twoPerson ? hhConf.ps5.twoPerson : hhConf.ps5.multiplePersonBaseMod * p);
            if (durationMinutes <= 30) {
                grandTotal += hhConf.ps5.less30m ? (hhConf.ps5.less30m * p) : (baseCost / 2);
            } else {
                const fullHours = Math.max(1, Math.floor(durationMinutes / 60));
                const partialMinutes = durationMinutes >= 60 ? durationMinutes % 60 : 0;
                const extra30Blocks = partialMinutes > 0 ? Math.ceil(partialMinutes / 30) : 0;
                const extraRate = (hhConf.ps5.extra30mMod || (baseCost / 2)) * (p > 2 ? p : 1);
                grandTotal += fullHours * baseCost + (extra30Blocks * extraRate);
            }
        });

        if (numPC > 0 && totalPeopleOnPC > 0) {
            const p = totalPeopleOnPC;
            const baseCost = p === 1 ? hhConf.pc.base : (p === 2 && hhConf.pc.twoPerson ? hhConf.pc.twoPerson : (hhConf.pc.multiplePersonBaseMod || hhConf.pc.base) * p);
            if (durationMinutes <= 30) {
                grandTotal += hhConf.pc.less30m ? (hhConf.pc.less30m * p) : (baseCost / 2);
            } else {
                const fullHours = Math.max(1, Math.floor(durationMinutes / 60));
                const partialMinutes = durationMinutes >= 60 ? durationMinutes % 60 : 0;
                const extra30Blocks = partialMinutes > 0 ? Math.ceil(partialMinutes / 30) : 0;
                const extraRate = (hhConf.pc.extra30m || (baseCost / 2)) * (p > 1 ? p : 1);
                grandTotal += fullHours * baseCost + (extra30Blocks * extraRate);
            }
        }

        if (numWheel > 0) {
            let wCost = 0;
            if (durationMinutes <= 30) {
                wCost = hhConf.wheel.less30m;
            } else {
                const base = hhConf.wheel.base;
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                wCost = base + (extra30Blocks * (hhConf.wheel.extra60m || 60));
            }
            grandTotal += wCost * numWheel;
        }

        return grandTotal;
    }

    // 2️⃣ NORMAL HOUR
    if (isNormal) {
        if (numWheel > 0) {
            let wCost = 0;
            if (durationMinutes <= 30) wCost = nhConf.wheel.less30m;
            else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                wCost = nhConf.wheel.base + (extra30Blocks * nhConf.wheel.extra30m);
            }
            grandTotal += wCost * numWheel;
        }

        if (numPC > 0 && totalPeopleOnPC > 0) {
            const p = totalPeopleOnPC;
            const baseCost = p === 1 ? nhConf.pc.base : (p === 2 && nhConf.pc.twoPerson ? nhConf.pc.twoPerson : (nhConf.pc.multiplePersonBaseMod || nhConf.pc.base) * p);
            if (durationMinutes <= 30) {
                grandTotal += nhConf.pc.less30m ? (nhConf.pc.less30m * p) : (baseCost / 2);
            } else {
                const fullHours = Math.max(1, Math.floor(durationMinutes / 60));
                const partialMinutes = durationMinutes >= 60 ? durationMinutes % 60 : 0;
                const extra30Blocks = partialMinutes > 0 ? Math.ceil(partialMinutes / 30) : 0;
                const extraRate = (nhConf.pc.extra30m || (baseCost / 2)) * (p > 1 ? p : 1);
                let pCost = fullHours * baseCost + (extra30Blocks * extraRate);
                if (durationHours > 5 && nhConf.pc.hourRateIfMoreThan3h) {
                    pCost = Math.min(pCost, (nhConf.pc.hourRateIfMoreThan3h * p) * durationHours);
                }
                grandTotal += pCost;
            }
        }

        psDistribution.forEach((p: number) => {
            if (p === 0) return;
            const baseCost = p === 1 ? nhConf.ps5.onePerson : (p === 2 && nhConf.ps5.twoPerson ? nhConf.ps5.twoPerson : nhConf.ps5.multiplePersonBaseMod * p);
            if (durationMinutes <= 30) {
                grandTotal += nhConf.ps5.less30m ? (nhConf.ps5.less30m * p) : (baseCost / 2);
            } else {
                const fullHours = Math.max(1, Math.floor(durationMinutes / 60));
                const partialMinutes = durationMinutes >= 60 ? durationMinutes % 60 : 0;
                const extra30Blocks = partialMinutes > 0 ? Math.ceil(partialMinutes / 30) : 0;
                const extraRate = (nhConf.ps5.extra30mMod || (baseCost / 2)) * (p > 2 ? p : 1);
                grandTotal += fullHours * baseCost + (extra30Blocks * extraRate);
            }
        });

        return grandTotal;
    }

    // 3️⃣ FUN NIGHT
    if (isFun) {
        if (numWheel > 0) {
            let wCost = 0;
            if (durationMinutes <= 30) wCost = fnConf.wheel.less30m;
            else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                wCost = fnConf.wheel.base + (extra30Blocks * (fnConf.wheel.extra30m || 75));
            }
            grandTotal += wCost * numWheel;
        }

        if (numPC > 0 && totalPeopleOnPC > 0) {
            const p = totalPeopleOnPC;
            const baseCost = p === 1 ? fnConf.pc.base : (p === 2 && fnConf.pc.twoPerson ? fnConf.pc.twoPerson : (fnConf.pc.multiplePersonBaseMod || fnConf.pc.base) * p);
            if (durationMinutes <= 30) {
                grandTotal += fnConf.pc.less30m ? (fnConf.pc.less30m * p) : (baseCost / 2);
            } else {
                const fullHours = Math.max(1, Math.floor(durationMinutes / 60));
                const partialMinutes = durationMinutes >= 60 ? durationMinutes % 60 : 0;
                const extra30Blocks = partialMinutes > 0 ? Math.ceil(partialMinutes / 30) : 0;
                const extraRate = (fnConf.pc.extra30m || (baseCost / 2)) * (p > 1 ? p : 1);
                let pCost = fullHours * baseCost + (extra30Blocks * extraRate);
                if (durationHours > 3 && fnConf.pc.hourRateIfMoreThan3h) {
                    pCost = Math.min(pCost, (fnConf.pc.hourRateIfMoreThan3h * p) * durationHours);
                }
                grandTotal += pCost;
            }
        }

        psDistribution.forEach((p: number) => {
            if (p === 0) return;
            const baseCost = p === 1 ? fnConf.ps5.onePerson : (p === 2 && fnConf.ps5.twoPerson ? fnConf.ps5.twoPerson : fnConf.ps5.multiplePersonBaseMod * p);
            if (durationMinutes <= 30) {
                grandTotal += fnConf.ps5.less30m ? (fnConf.ps5.less30m * p) : (baseCost / 2);
            } else {
                const fullHours = Math.max(1, Math.floor(durationMinutes / 60));
                const partialMinutes = durationMinutes >= 60 ? durationMinutes % 60 : 0;
                const extra30Blocks = partialMinutes > 0 ? Math.ceil(partialMinutes / 30) : 0;
                const extraRate = (fnConf.ps5.extra30mMod || (baseCost / 2)) * (p > 2 ? p : 1);
                grandTotal += fullHours * baseCost + (extra30Blocks * extraRate);
            }
        });

        return grandTotal;
    }

    if (grandTotal === 0 && (numPS + numPC + numWheel + numVR + numMetaBat) > 0) {
        return durationHours * peopleCount * (config.fallback?.hourRate || 50);
    }

    return grandTotal;
};
