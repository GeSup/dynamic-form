import { LionCheckboxGroup, LionCheckbox } from '@lion/checkbox-group';
import { ScopedElementsMixin, LitElement, html } from '@lion/core';

export default class CheckboxGroup extends ScopedElementsMixin(LitElement) {
  static get properties() {
    return {
      data: { type: Object },
    };
  }

  static get scopedElements() {
    return {
      'lion-checkbox-group': LionCheckboxGroup,
      'lion-checkbox': LionCheckbox,
    };
  }

  render() {
    return html`<lion-checkbox-group
      label=${this.data.label}
      name=${this.data.name}
      .validators=${this.data.validators || []}
    >
      ${this.data?.dataset.map(
        checkbox =>
          html`<lion-checkbox
            label=${checkbox}
            .choiceValue=${checkbox}
          ></lion-checkbox>`
      )}
    </lion-checkbox-group>`;
  }
}
