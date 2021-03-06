function createElementFromString(string) {
  const div = document.createElement("div");
  div.innerHTML = string.trim();
  return div.firstElementChild;
}

export default class SortableTable {
  /**@type HTMLElement */
  element;
  subElements = {};

  onSortClick = event => {
    const col = event.target.closest("[data-sortable='true']");

    const toggleType = oldType => {
      switch (oldType) {
        case 'asc':
          return 'desc';
        case 'desc':
          return 'asc';
        default:
          return 'asc';
      }
    }

    if (col) {
      const {
        id,
        order
      } = col.dataset;

      const arrow = document.body.querySelector('.sortable-table__sort-arrow');
      this.sortConfig = {
        type: toggleType(order),
        id
      };
      col.dataset.order = this.sortConfig.type;

      if (arrow) {
        col.append(arrow);
      }

      this.sort(id, this.sortConfig.type);

    }
  }

  constructor(header = [], {
    data = []
  }) {
    this.header = header;
    this.data = data;
    this.sortConfig = {
      type: 'asc',
      id: header.find(item => item.sortable).id
    };
    this.render();
    this.initEventListeners();
  }

  get sortableArrow() {
    return `
    <span data-element="arrow" class="sortable-table__sort-arrow">
              <span class="sort-arrow"></span>
            </span>
    `;
  }

  get headerData() {
    return this.header
      .map((item) => {
        const sortable = item.sortable && item.id === this.sortConfig.id ? this.sortableArrow : "";
        return `
      <div
        class="sortable-table__cell"
        data-id="${item.id}"
        data-sortable="${item.sortable}"
        data-order="${this.sortConfig.type}"
      >
        <span>${item.title}</span>
        ${sortable}
      </div>
      `;
      })
      .join("");
  }

  headerDescription() {
    return this.header.map((description) => {
      return {
        id: description.id,
        template: description.template,
      };
    });
  }

  getRow(headerDescription, rowData) {
    return headerDescription.map((header) => {
      if (header.template) {
        return header.template(rowData[header.id]);
      }
      return `<div class="sortable-table__cell">${rowData[header.id]}</div>`;
    });
  }

  get bodyData() {
    const headerDescription = this.headerDescription();
    return this.data
      .map(
        (item) => `
      <a href="/products/${item.id}" class="sortable-table__row">
        ${this.getRow(headerDescription, item).join("")}
      </a>
      `
      )
      .join("");
  }

  get template() {
    return `
    <div data-element="productsContainer" class="products-list__container">
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.headerData}
        </div>
        <div data-element="body" class="sortable-table__body">
        ${this.bodyData}
        </div>
        <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
        <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
          <div>
            <p>No products satisfies your filter criteria</p>
            <button type="button" class="button-primary-outline">Reset all filters</button>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  render() {
    this.element = createElementFromString(this.template);
    this.subElements = this.getSubElements(this.element);
  }

  initEventListeners() {
    if (this.subElements && this.subElements.hasOwnProperty('header')) {
      this.subElements.header.addEventListener('pointerdown', this.onSortClick);
    }
  }

  getSubElements(element) {
    const elements = element.querySelectorAll("[data-element]");

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  destroy() {
    this.remove();
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
    this.element = null;
    this.subElements = null;
  }

  sort(field, type = "asc") {
    const header = this.header.find((h) => h.id === field);
    if (header && header.sortable) {
      const {
        sortType
      } = header;
      this.data = [...this.data].sort((a, b) => {
        switch (type) {
          case "desc":
            return this.compare(b[field], a[field], sortType);
          case "asc":
          default:
            return this.compare(a[field], b[field], sortType);
        }
      });
      if (this.subElements.body) {
        this.subElements.body.innerHTML = this.bodyData;
      }
    }
  }

  compare(first, second, type = "number") {
    switch (type) {
      case "number":
        return first - second;
      case "string":
        return first.localeCompare(second, ["ru", "en"], {
          caseFirst: "upper",
        });
    }
    return 0;
  }
}
