// ---------------- TIME HELPERS ----------------
const isHappyHourTime = (date = new Date(), config) => {
    if (!config) return false;
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
const isFunNightTime = (date = new Date(), config) => {
    if (!config) return false;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const check = config.funNight;
    if (check.startHour > check.endHour) {
        return hours > check.startHour || (hours === check.startHour && minutes >= check.startMinute) || hours < check.endHour || (hours === check.endHour && minutes < check.endMinute);
    } else {
        return (hours > check.startHour || (hours === check.startHour && minutes >= check.startMinute)) && (hours < check.endHour || (hours === check.endHour && minutes < check.endMinute));
    }
};
const isNormalHourTime = (date = new Date(), config) => {
    if (!config) return false;
    const day = date.getDay();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const isMonWed = day >= 1 && day <= 3;
    const isThursday = day === 4;
    const isFriSun = day === 5 || day === 6 || day === 0;
    const check = config.normalHour;
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
        if (hours > check.friSunStartHour && hours < check.friSunEndHour) return true;
        if (hours === check.friSunStartHour && hours === check.friSunEndHour) return minutes >= check.friSunStartMinute && minutes < check.friSunEndMinute;
        if (hours === check.friSunStartHour) return minutes >= check.friSunStartMinute;
        if (hours === check.friSunEndHour) return minutes < check.friSunEndMinute;
        return false;
    }
    return false;
};
// ---------------- PRICING ----------------
const calculateSessionPrice = (
    durationHours,
    peopleCount,
    devices,
    startTime = new Date(),
    config // Pass config from controller
) => {
    if (!config) return 0;
    const durationMinutes = durationHours * 60;
    const getDeviceIds = (val) => {
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
    const psDistribution = [];
    if (numPS > 0) {
        if (totalPeopleOnPS === 0) {
            for (let i = 0; i < numPS; i++) psDistribution.push(0);
        } else {
            const baseSplit = Math.floor(totalPeopleOnPS / numPS);
            const remainder = totalPeopleOnPS % numPS;
            for (let i = 0; i < numPS; i++) {
                psDistribution.push(i < remainder ? baseSplit + 1 : baseSplit);
            }
        }
    }
    const pcDistribution = [];
    if (numPC > 0) {
        if (totalPeopleOnPC === 0) {
            for (let i = 0; i < numPC; i++) pcDistribution.push(0);
        } else if (totalPeopleOnPC === 2 && numPC === 2) {
            // Group 2 players on 2 PCs into a single '2-person' block to trigger the twoPerson bundle price
            pcDistribution.push(2);
        } else {
            const baseSplit = Math.floor(totalPeopleOnPC / numPC);
            const remainder = totalPeopleOnPC % numPC;
            for (let i = 0; i < numPC; i++) {
                pcDistribution.push(i < remainder ? baseSplit + 1 : baseSplit);
            }
        }
    }
    const { vr: vrConf, metabat: metabatConf } = config;
    const getPriceForSpecs = (conf, pCount) => {
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
    const day = startTime.getDay();
    const isMonWed = day >= 1 && day <= 3;
    const isThursday = day === 4;
    const dayPrices = isMonWed ? config.monWedPrices : (isThursday ? config.thursdayPrices : config.friSunPrices);
    const hhConf = dayPrices.happyHour;
    const nhConf = dayPrices.normalHour;
    const fnConf = dayPrices.funNight;
    const isHappy = isHappyHourTime(startTime, config);
    const isNormal = isNormalHourTime(startTime, config);
    const isFun = isFunNightTime(startTime, config);
    // 1️⃣ HAPPY HOUR
    if (isHappy) {
        psDistribution.forEach(p => {
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
        // PC
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
            let wheelCost = 0;
            if (durationMinutes <= 30) {
                wheelCost = hhConf.wheel.less30m;
            } else {
                const base = hhConf.wheel.base;
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                const extraRate = hhConf.wheel.extra30m || (hhConf.wheel.extra60m ? hhConf.wheel.extra60m / 2 : base / 2);
                wheelCost = base + (extra30Blocks * extraRate);
            }
            grandTotal += wheelCost * numWheel;
        }
        return grandTotal;
    }
    // 2️⃣ NORMAL HOUR
    if (isNormal) {
        if (numWheel > 0) {
            let wheelCost = 0;
            if (durationMinutes <= 30) wheelCost = nhConf.wheel.less30m;
            else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                wheelCost = nhConf.wheel.base + (extra30Blocks * nhConf.wheel.extra30m);
            }
            grandTotal += wheelCost * numWheel;
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
        psDistribution.forEach(p => {
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
            let wheelCost = 0;
            if (durationMinutes <= 30) wheelCost = fnConf.wheel.less30m;
            else {
                const extraMinutes = Math.max(0, durationMinutes - 60);
                const extra30Blocks = Math.ceil(extraMinutes / 30);
                wheelCost = fnConf.wheel.base + (extra30Blocks * fnConf.wheel.extra30m);
            }
            grandTotal += wheelCost * numWheel;
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
        psDistribution.forEach(p => {
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
const calculateRevenueByMachine = (
    durationHours,
    peopleCount,
    devices,
    startTime = new Date(),
    config
) => {
    if (!config) return { ps: 0, pc: 0, vr: 0, wheel: 0, metabat: 0 };
    const revenue = { ps: 0, pc: 0, vr: 0, wheel: 0, metabat: 0 };
    const durationMinutes = durationHours * 60;
    const getIds = (val) => Array.isArray(val) ? val : (typeof val === 'number' && val > 0 ? [val] : []);
    const ps = getIds(devices.ps);
    const pc = getIds(devices.pc);
    const vr = getIds(devices.vr);
    const wheel = getIds(devices.wheel);
    const meta = getIds(devices.metabat);
    const { vr: vrConf } = config;
    const vrRate = durationMinutes <= 15 ? (vrConf.first15m) :
        durationMinutes <= 30 ? (vrConf.first30m) :
            durationMinutes <= 60 ? (vrConf.hour) :
                (durationMinutes / 60) * vrConf.hour;
    revenue.vr += vr.length * vrRate;
    revenue.metabat += meta.length * vrRate;
    const numPS = ps.length;
    const numPC = pc.length;
    const numVR = vr.length;
    const numWheel = wheel.length;
    const numMetaBat = meta.length;
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
    const psDistribution = [];
    if (numPS > 0) {
        if (totalPeopleOnPS === 0) {
            for (let i = 0; i < numPS; i++) psDistribution.push(0);
        } else {
            const baseSplit = Math.floor(totalPeopleOnPS / numPS);
            const remainder = totalPeopleOnPS % numPS;
            for (let i = 0; i < numPS; i++) {
                psDistribution.push(i < remainder ? baseSplit + 1 : baseSplit);
            }
        }
    }
    const pcDistribution = [];
    if (numPC > 0) {
        if (totalPeopleOnPC === 0) {
            for (let i = 0; i < numPC; i++) pcDistribution.push(0);
        } else if (totalPeopleOnPC === 2 && numPC === 2) {
            // Group 2 players on 2 PCs into a single '2-person' block to trigger the twoPerson bundle price
            pcDistribution.push(2);
        } else {
            const baseSplit = Math.floor(totalPeopleOnPC / numPC);
            const remainder = totalPeopleOnPC % numPC;
            for (let i = 0; i < numPC; i++) {
                pcDistribution.push(i < remainder ? baseSplit + 1 : baseSplit);
            }
        }
    }
    const day = startTime.getDay();
    const isMonWed = day >= 1 && day <= 3;
    const isThursday = day === 4;
    const dayPrices = isMonWed ? config.monWedPrices : (isThursday ? config.thursdayPrices : config.friSunPrices);
    const hhConf = dayPrices.happyHour;
    const nhConf = dayPrices.normalHour;
    const fnConf = dayPrices.funNight;
    const isHappy = isHappyHourTime(startTime, config);
    const isNormal = isNormalHourTime(startTime, config);
    const isFun = isFunNightTime(startTime, config);
    pcDistribution.forEach(p => {
        if (p === 0) return;
        const curConf = isHappy ? hhConf.pc : (isNormal ? nhConf.pc : fnConf.pc);
        const baseCost = p === 1 ? curConf.base : (p === 2 && curConf.twoPerson ? curConf.twoPerson : (curConf.multiplePersonBaseMod || curConf.base) * p);
        if (durationMinutes <= 30) {
            revenue.pc += curConf.less30m ? (curConf.less30m * p) : (baseCost / 2);
        } else {
            const fullHours = Math.max(1, Math.floor(durationMinutes / 60));
            const partialMinutes = durationMinutes >= 60 ? durationMinutes % 60 : 0;
            const extra30Blocks = partialMinutes > 0 ? Math.ceil(partialMinutes / 30) : 0;
            const extraRate = (curConf.extra30m || (baseCost / 2)) * (p > 1 ? p : 1);
            let pCost = fullHours * baseCost + (extra30Blocks * extraRate);
            if (durationHours > 3 && !isHappy && curConf.hourRateIfMoreThan3h) {
                pCost = Math.min(pCost, (curConf.hourRateIfMoreThan3h * p) * durationHours);
            }
            revenue.pc += pCost;
        }
    });
    if (wheel.length > 0) {
        let wheelCost = 0;
        const curConf = isHappy ? hhConf.wheel : (isNormal ? nhConf.wheel : fnConf.wheel);
        if (durationMinutes <= 30) {
            wheelCost = curConf.less30m;
        } else {
            const extraMinutes = Math.max(0, durationMinutes - 60);
            const extra30Blocks = Math.ceil(extraMinutes / 30);
            const extraRate = curConf.extra30m || (curConf.extra60m ? curConf.extra60m / 2 : curConf.base / 2);
            wheelCost = curConf.base + (extra30Blocks * extraRate);
        }
        revenue.wheel += wheelCost * wheel.length;
    }
    psDistribution.forEach(p => {
        if (p === 0) return;
        const curConf = isHappy ? hhConf.ps5 : (isNormal ? nhConf.ps5 : fnConf.ps5);
        const baseCost = p === 1 ? (curConf.onePerson || curConf.onePersonBase) : (p === 2 && curConf.twoPerson ? curConf.twoPerson : curConf.multiplePersonBaseMod * p);
        if (durationMinutes <= 30) {
            revenue.ps += curConf.less30m ? (curConf.less30m * p) : (baseCost / 2);
        } else {
            const fullHours = Math.max(1, Math.floor(durationMinutes / 60));
            const partialMinutes = durationMinutes >= 60 ? durationMinutes % 60 : 0;
            const extra30Blocks = partialMinutes > 0 ? Math.ceil(partialMinutes / 30) : 0;
            const extraRate = (curConf.extra30mMod || (baseCost / 2)) * (p > 2 ? p : 1);
            revenue.ps += fullHours * baseCost + (extra30Blocks * extraRate);
        }
    });
    return revenue;
};
module.exports = {
    isHappyHourTime,
    isFunNightTime,
    isNormalHourTime,
    calculateSessionPrice,
    calculateRevenueByMachine
};
