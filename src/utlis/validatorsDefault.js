import { Required, EqualsLength, MinLength, MaxLength } from '@lion/form-core';

Required.getMessage = async ({ fieldName }) =>
  `Wartość pola ${fieldName} jest wymagana.`;
EqualsLength.getMessage = async ({ fieldName, params }) =>
  `Wartość pola ${fieldName} nie uzyskała wymaganej ilości znaków. Wymagana długość: ${params}`;
MinLength.getMessage = async ({ fieldName, params }) =>
  `Wartość pola ${fieldName} nie osiągnęła minimalnej ilości znaków. Minimalna długość: ${params}`;
MaxLength.getMessage = async ({ fieldName, params }) =>
  `Wartość pola ${fieldName} przekroczyła maksymalną ilości znaków. Maksymalna długość: ${params}`;

export { Required, EqualsLength, MinLength, MaxLength };
