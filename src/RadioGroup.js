import { ScopedElementsMixin, LitElement, html } from '@lion/core';
import { LionRadio, LionRadioGroup } from '@lion/radio-group';

export default class RadioGroup extends ScopedElementsMixin(LitElement) {
  static get properties() {
    return {
      data: { type: Object },
    };
  }

  static get scopedElements() {
    return {
      'lion-radio-group': LionRadioGroup,
      'lion-radio': LionRadio,
    };
  }

  render() {
    return html`<lion-radio-group
      label=${this.data.label}
      name=${this.data.name}
      .validators=${this.data.validators || []}
    >
      ${this.data?.dataset.map(
        radio =>
          html`<lion-radio label=${radio} .choiceValue=${radio}></lion-radio>`
      )}
    </lion-radio-group>`;
  }
}
