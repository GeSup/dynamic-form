import { ScopedElementsMixin, html, css, LitElement } from '@lion/core';
import { LionInput } from '@lion/input';
import { LionSelect } from '@lion/select';
import { LionTextarea } from '@lion/textarea';
import { ajax } from '@lion/ajax';
import { Required, EqualsLength, MinLength, MaxLength } from '@lion/form-core';
import { LionButtonSubmit } from '@lion/button';
import RadioGroup from './RadioGroup.js';
import CheckboxGroup from './CheckboxGroup.js';

Required.getMessage = async data =>
  `Wartość pola ${data.fieldName} jest wymagana.`;
EqualsLength.getMessage = async data =>
  `Wartość pola ${data.fieldName} nie uzyskała wymaganej ilości znaków. Wymagana długość: ${data.params}`;
MinLength.getMessage = async data =>
  `Wartość pola ${data.fieldName} nie osiągnęła minimalnej ilości znaków. Minimalna długość: ${data.params}`;
MaxLength.getMessage = async data =>
  `Wartość pola ${data.fieldName} przekroczyła maksymalną ilości znaków. Maksymalna długość: ${data.params}`;

export class DynamicForm extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'lion-input': LionInput,
      'lion-select': LionSelect,
      'lion-textarea': LionTextarea,
      'radio-group': RadioGroup,
      'checkbox-group': CheckboxGroup,
      'lion-button-submit': LionButtonSubmit,
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 25px;
        color: var(--dynamic-form-text-color, #000);
      }
    `;
  }

  static get properties() {
    return {
      fields: {
        type: Array,
      },
      textStatus: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.fields = [];
    ajax.fetchJson('../api/simple-form.json').then(({ response, body }) => {
      if (response.status === 200) {
        this.fields = this.convertJson(body).map(this._renderByType);
      }
    });

    this._templatesForTypes = {
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
    };

    this._renderByType = field => this._templatesForTypes[field.type](field);
  }

  // eslint-disable-next-line class-methods-use-this
  convertJson(jsonData) {
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

  _submitHandler({ target }) {
    if (target.hasFeedbackFor.includes('error')) {
      const firstWithError = target.formElements.find(element =>
        element.hasFeedbackFor.includes('error')
      );
      firstWithError.focus();
      return;
    }
    const submitButton = target.querySelector('lion-button-submit');
    submitButton.disabled = true;
    ajax
      .fetchJson('../api', {
        method: 'POST',
        body: JSON.stringify(target.serializedValue),
      })
      .then(({ response }) => {
        if (response.status === 200) {
          this.textStatus = 'Zapisano formularz';
        } else {
          this.textStatus = 'Zapis nie powiódł się';
        }
      })
      .catch(err => {
        console.log(err);
        this.textStatus = 'Zapis nie powiódł się';
      });
  }

  render() {
    return html`
      <lion-form @submit=${this._submitHandler}>
        <form>
          ${this.fields.length ? this.fields : html`<span>Loading...</span>`}
          <lion-button-submit>Zapisz</lion-button-submit>
        </form>
      </lion-form>
      <span>${this.textStatus}</span>
    `;
  }
}
