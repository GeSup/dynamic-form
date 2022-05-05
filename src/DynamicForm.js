import { ScopedElementsMixin, html, css, LitElement } from '@lion/core';
import { LionInput } from '@lion/input';
import { LionSelect } from '@lion/select';
import { LionTextarea } from '@lion/textarea';
import '@lion/checkbox-group/define';
import { LionRadioGroup, LionRadio } from '@lion/radio-group';
import { ajax } from '@lion/ajax';
import { Required } from '@lion/form-core';
import { loadDefaultFeedbackMessages } from '@lion/validate-messages';



export class DynamicForm extends ScopedElementsMixin(LitElement) {

  static get scopedElements() {
    return {
      'lion-input': LionInput,
      'lion-select': LionSelect,
      'lion-textarea': LionTextarea,
      'lion-radio-group': LionRadioGroup,
      'lion-radio': LionRadio
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
      inputs: { 
        type: Array,
      }
    }
  }  
  
  constructor() {
    super();
    this.inputs = [];
    this.__formResults = {};
    ajax.fetchJson('../api/simple-form.json')
    .then(result => {
      if (result.response.status === 200){
        for (const key of Object.keys(result.body)) {
          this.inputs = [...this.inputs,{label: key, ...result.body[key]}];
        }
      }
    })
    loadDefaultFeedbackMessages()
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

  renderText = (data) => html`
    <lion-input label=${data.label} name=${data.label.replace(' ', '')} @input=${this.inputHandler} .validators=${[new Required()]}></lion-input>`
  renderTextArea = (data) => html`
    <lion-textarea label=${data.label} name=${data.label.replace(' ', '')} @input=${this.inputHandler}></lion-textarea>`
  renderSelect = (data) => html`
    <lion-select label=${data.label} name=${data.label.replace(' ', '')} @input=${this.inputHandler}>
      <select slot="input">
        <option selected hidden>Please select</option>
        ${data?.dataset.map(option => html`<option value=${option}>${option}</option>`)}
      </select>
    </lion-select>`
  renderCheckbox = (data) => html`
    <lion-checkbox-group label=${data.label} name=${data.label} @input=${this.inputHandler}>
      ${data?.dataset.map(checkbox => html`<lion-checkbox label=${checkbox} .choiceValue=${checkbox} ></lion-checkbox>`)}
    </lion-checkbox-group>`
  renderRadioGroup = (data) => html`
    <lion-radio-group label=${data.label} name=${data.label.replace(' ', '')} @input=${this.inputHandler}>
      ${data?.dataset.map(radio => html`<lion-radio label=${radio} .choiceValue=${radio}></lion-radio>`)}
    </lion-radio-group>`

  __renderByType = (input) => {
    const renderFunc = {
      'text': 'renderText',
      'textarea': 'renderTextArea',
      'select': 'renderSelect',
      'checkbox': 'renderCheckbox',
      'radio-group': 'renderRadioGroup'
    }[input.type];
    return this[renderFunc](input);
  }

  
  __submitHandler() {
    this.status = true;
  } 

  render() {
    return html`
      <lion-form @submit=${this.__submitHandler}>
        <form>
          ${this.inputs.length ? this.inputs.map(this.__renderByType) : html`<span>Loading...</span>`}
        </form>
      </lion-form>
    `;
  }
}
