import { ScopedElementsMixin, html, css, LitElement } from '@lion/core';
import { LionInput } from '@lion/input';
import { LionSelect } from '@lion/select';
import { LionTextarea } from '@lion/textarea';
import '@lion/checkbox-group/define';
import { LionRadioGroup, LionRadio } from '@lion/radio-group';
import { ajax } from '@lion/ajax';
import { Required, EqualsLength, MinLength, MaxLength } from '@lion/form-core';
import { LionButtonSubmit } from '@lion/button';

Required.getMessage = async (data) => {
  console.log('data request => ', data)
  return `Wartość pola ${data.fieldName} jest wymagana.`
}

EqualsLength.getMessage = async (data) => {
  console.log('data EqualsLength :>> ', data);
  return `Wartość pola ${data.fieldName} nie osiągneła wymaganej ilości znaków. Wymagana długość: ${data.params}`
}

MinLength.getMessage = async (data) => {
  console.log('data MinLength => ', data);
  return `Wartość pola ${data.fieldName} nie osiągneła minimalnej ilości znaków. Minimalna długość: ${data.params}`
}

MaxLength.getMessage = async (data) => {
  console.log('data MaxLength => ', data);
  return `Wartość pola ${data.fieldName} przekroczyła maksymalną ilości znaków. Maksymalna długość: ${data.params}`
}

export class DynamicForm extends ScopedElementsMixin(LitElement) {

  static get scopedElements() {
    return {
      'lion-input': LionInput,
      'lion-select': LionSelect,
      'lion-textarea': LionTextarea,
      'lion-radio-group': LionRadioGroup,
      'lion-radio': LionRadio,
      'lion-button-submit': LionButtonSubmit
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
      }
    }
  }  
  
  constructor() {
    super();
    this.fields = [];
    this.__formResults = {};
    ajax.fetchJson('../api/simple-form.json')
    .then(result => {
      if (result.response.status === 200){
        this.fields = this.convertJson(result.body)
      }
    })
  }

  convertJson(jsonData){
    const dictionary = {
      "name": "imie",
      "surname": "nazwisko",
      "nationality": "narodowość"
    }
    const strToValidator = {
      "required": () => new Required(),
      "max-len": (param) => new MaxLength(param),
      "min-len": (param) => new MinLength(param),
      "len": (param) => new EqualsLength(param),
    }
    const validatorConvert = string => {
      const [strValidator, param] = string.split(':');
      return strToValidator[strValidator](param);
    }
    const fields = [];
    for (const key of Object.keys(jsonData)) {
      if (jsonData[key].validators) jsonData[key].validators = jsonData[key].validators.map(validatorConvert);
      fields.push({
        name: key, 
        label: dictionary[key] || key,
        ...jsonData[key]});
    }
    return fields;
  }

  inputHandler(event){
    if (event.target.type === 'checkbox'){
      const checkboxes = this.__formResults[event.target.name] || {}; 
      checkboxes[event.target.value] = event.target.checked;
      this.__formResults[event.target.name] = checkboxes;
    } else { 
      this.__formResults[event.target.name] = event.target.value;
    } console.log('this.__formResults :>> ', this.__formResults);
  }

  templatesForTypes = {
    "text": (data) => html`
      <lion-input label=${data.label} name=${data.name} @input=${this.inputHandler} .validators=${data.validators || []}></lion-input>`,
    "textarea": (data) => html`
       <lion-textarea label=${data.label} name=${data.name} @input=${this.inputHandler} .validators=${data.validators || []}></lion-textarea>`,
    "select": (data) => html`
      <lion-select label=${data.label} name=${data.name} @input=${this.inputHandler} .validators=${data.validators || []}>
        <select slot="input">
          <option selected hidden>Wybierz</option>
          ${data?.dataset.map(option => html`<option value=${option}>${option}</option>`)}
        </select>
      </lion-select>`,
    "checkbox":(data) => html`
      <lion-checkbox-group label=${data.label} name=${data.name} @input=${this.inputHandler} .validators=${data.validators || []}>
        ${data?.dataset.map(checkbox => html`<lion-checkbox label=${checkbox} .choiceValue=${checkbox} ></lion-checkbox>`)}
      </lion-checkbox-group>`,
    'radio-group': (data) => html`
      <lion-radio-group label=${data.label} name=${data.name} @input=${this.inputHandler} .validators=${data.validators || []}>
        ${data?.dataset.map(radio => html`<lion-radio label=${radio} .choiceValue=${radio}></lion-radio>`)}
      </lion-radio-group>`
  }

  __renderByType = (field) => this.templatesForTypes[field.type](field);

  
  __submitHandler(event) {
    event.preventDefault();
    this.status = true;
  } 

  render() {
    console.log('this.fields => ', this.fields);
    return html`
      <lion-form @submit=${this.__submitHandler}>
        <form>
          ${this.fields.length ? this.fields.map(this.__renderByType) : html`<span>Loading...</span>`}
          <lion-button-submit>Zapisz</lion-button-submit> 
        </form>
      </lion-form>
    `;
  }
}
