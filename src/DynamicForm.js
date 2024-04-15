import { ScopedElementsMixin, html, css, LitElement } from '@lion/core';
import { LionInput } from '@lion/input';
import { LionSelect } from '@lion/select';
import { LionTextarea } from '@lion/textarea';
import { LionButtonSubmit } from '@lion/button';
import RadioGroup from './RadioGroup.js';
import CheckboxGroup from './CheckboxGroup.js';
import {
  getFormData,
  getTextSubmit,
  templateByType,
} from './utlis/functions.js';

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
  }

  async connectedCallback() {
    super.connectedCallback();
    const formData = await getFormData();
    this.fields = formData.map(templateByType);
  }

  async _submitHandler({ target }) {
    if (target.hasFeedbackFor.includes('error')) {
      const firstWithError = target.formElements.find(element =>
        element.hasFeedbackFor.includes('error')
      );
      firstWithError.focus();
      return;
    }
    const submitButton = target.querySelector('lion-button-submit');
    submitButton.disabled = true;
    this.textStatus = await getTextSubmit(target);
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
