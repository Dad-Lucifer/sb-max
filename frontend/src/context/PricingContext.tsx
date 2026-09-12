import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { defaultPricingConfig } from '../types/pricingConfig';
import type { PricingConfig } from '../types/pricingConfig';
import type { ReactNode } from 'react';

const deepMerge = (target: any, source: any): any => {
    if (!source) return target;
    if (typeof target !== 'object' || target === null) return source;
    if (typeof source !== 'object' || source === null) return source;
    
    if (Array.isArray(target) || Array.isArray(source)) {
        return source;
    }

    const output = { ...target };
    Object.keys(source).forEach(key => {
        if (source[key] instanceof Object && !Array.isArray(source[key]) && key in target) {
            output[key] = deepMerge(target[key], source[key]);
        } else {
            output[key] = source[key];
        }
    });
    return output;
};

interface PricingContextType {
    config: PricingConfig;
    loading: boolean;
    refreshConfig: () => void;
}

const PricingContext = createContext<PricingContextType>({
    config: defaultPricingConfig,
    loading: true,
    refreshConfig: () => { }
});

export const usePricing = () => useContext(PricingContext);

export const PricingProvider = ({ children }: { children: ReactNode }) => {
    const [config, setConfig] = useState<PricingConfig>(defaultPricingConfig);
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/pricing');
            if (response.data) {
                setConfig(deepMerge(defaultPricingConfig, response.data));
            }
        } catch (error) {
            console.error('Failed to fetch pricing config:', error);
            // Default config is already set, so we just proceed
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    return (
        <PricingContext.Provider value={{ config, loading, refreshConfig: fetchConfig }}>
            {children}
        </PricingContext.Provider>
    );
};
