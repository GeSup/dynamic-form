import { ajax } from '@lion/ajax';
import { html, nothing } from '@lion/core';
import {
  Required,
  EqualsLength,
  MinLength,
  MaxLength,
} from './validatorsDefault.js';

function convertJson(jsonData) {
  const dictionary = {
    name: 'imie',
    surname: 'nazwisko',
    nationality: 'narodowość',
  };

  const strToValidator = {
    required: () => new Required(),
    'max-len': param => new MaxLength(param),
    'min-len': param => new MinLength(param),
    len: param => new EqualsLength(param),
  };

  const validatorConvert = string => {
    const [strValidator, param] = string.split(':');
    return strToValidator[strValidator](parseInt(param, 10));
  };

  const fields = [];
  for (const key of Object.keys(jsonData)) {
    const actualKey = jsonData[key];
    actualKey.validators = actualKey.validators?.map(validatorConvert);
    fields.push({
      name: key,
      label: dictionary[key] || key,
      ...actualKey,
    });
  }
  return fields;
}

export const getFormData = async () => {
  const { response, body } = await ajax.fetchJson('../../api/simple-form.json');
  if (response.status === 200) {
    return convertJson(body);
  }
  return [];
};

export const getTextSubmit = async ({ serializedValue }) => {
  try {
    const { response } = await ajax.fetchJson('../../api', {
      method: 'POST',
      body: JSON.stringify(serializedValue),
    });

    if (response.status === 200) {
      return 'Zapisano formularz';
    }
  } catch (err) {
    console.log(err);
  }
  return 'Zapis nie powiódł się';
};

export const templateByType = field =>
  ({
    text: data => html`<lion-input
      label=${data.label}
      name=${data.name}
      .validators=${data.validators || []}
    ></lion-input>`,
    textarea: data => html`<lion-textarea
      label=${data.label}
      name=${data.name}
      .validators=${data.validators || []}
    ></lion-textarea>`,
    select: data => html`<lion-select
      label=${data.label}
      name=${data.name}
      .validators=${data.validators || []}
    >
      <select slot="input">
        <option selected hidden>Wybierz</option>
        ${data?.dataset.map(
          option => html`<option value=${option}>${option}</option>`
        )}
      </select>
    </lion-select>`,
    checkbox: data => html`<checkbox-group .data=${data}> </checkbox-group>`,
    'radio-group': data => html`<radio-group .data=${data}></radio-group>`,
  }[field.type](field) || nothing);
