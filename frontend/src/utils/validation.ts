export const validateName = (name: string): { isValid: boolean; error?: string } => {
    if (!name) return { isValid: false, error: 'Name is required' };

    const trimmed = name.trim();
    if (trimmed.length < 2) return { isValid: false, error: 'Name must be at least 2 characters' };
    if (trimmed.length > 50) return { isValid: false, error: 'Name must be typically under 50 characters' };

    // Regex: Alphabets and single spaces only
    const nameRegex = /^[a-zA-Z]+(?: [a-zA-Z]+)*$/;
    if (!nameRegex.test(trimmed)) {
        return { isValid: false, error: 'Name must contain only alphabets and single spaces' };
    }

    return { isValid: true };
};

export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
    if (!phone) return { isValid: false, error: 'Phone number is required' };

    // Numeric only
    if (!/^\d+$/.test(phone)) {
        return { isValid: false, error: 'Phone must contain only numbers' };
    }

    if (phone.length !== 10) {
        return { isValid: false, error: 'Phone must be exactly 10 digits' };
    }

    return { isValid: true };
};

export const formatName = (name: string): string => {
    return name.trim().replace(/\s+/g, ' ');
};

export const formatPhone = (phone: string): string => {
    return phone.replace(/\D/g, '').slice(0, 10);
};
