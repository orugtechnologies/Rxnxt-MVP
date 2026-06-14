import { validatePrescriptionMedicine } from '../../utils/validation';

describe('validatePrescriptionMedicine', () => {
  it('should invalidate medicine if dosage form is missing', () => {
    const med = {
      generic_name: 'Amoxicillin',
      dosageForm: '',
      route: 'Oral',
      frequency: '1-0-1',
      duration: '5 Days'
    };

    const result = validatePrescriptionMedicine(med);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Dosage form is required. It cannot be empty or assumed.');
  });

  it('should validate medicine when all required fields are present', () => {
    const med = {
      brand_name: 'Dolo 650',
      dosageForm: 'Tablet',
      route: 'Oral',
      frequency: '1-0-1',
      duration: '5 Days'
    };

    const result = validatePrescriptionMedicine(med);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});
