Kamma.elements = [];

function Kamma(options = {}) {
  this.opt = Object.assign(
    {
      destroyOnClose: true,
      footer: false,
      cssClass: [],
      closeMethods: ["button", "overlay", "escape"],
    },
    options
  );

  this.template = document.querySelector(`#${this.opt.templateId}`);
  if (!this.template) {
    console.error(`#${this.opt.templateId} does not exist`);
    return;
  }

  const { closeMethods } = this.opt;
  this._allowButtonClose = closeMethods.includes("button");
  this._allowBackdropClose = closeMethods.includes("overlay");
  this._allowEscapeClose = closeMethods.includes("escape");

  this._footerButtons = [];

  this._handleEscapeKey = this._handleEscapeKey.bind(this);
}

Kamma.prototype._build = function () {
  const content = this.template.content.cloneNode(true);
  // create modal elements
  this._backdrop = document.createElement("div");
  this._backdrop.className = "kamma__backdrop";

  const container = document.createElement("div");
  container.className = "kamma__container";

  this.opt.cssClass.forEach((className) => {
    if (typeof className === "string") {
      container.classList.add(className);
    }
  });

  if (this._allowButtonClose) {
    const closeBtn = this._createButton("&times;", "kamma__close", () =>
      this.close()
    );
    container.append(closeBtn);
  }

  const modalContent = document.createElement("div");
  modalContent.className = "kamma__content";

  // Append content and elements
  modalContent.append(content);
  container.append(modalContent);

  if (this.opt.footer) {
    this._modalFooter = document.createElement("div");
    this._modalFooter.className = "kamma__footer";

    this._renderFooterContent();
    this._renderFooterButtons();

    container.append(this._modalFooter);
  }

  this._backdrop.append(container);
  document.body.append(this._backdrop);
};

Kamma.prototype.setFooterContent = function (html) {
  this._footerContent = html;
  this._renderFooterContent();
};

Kamma.prototype.addFooterButton = function (title, cssClass, callback) {
  const button = this._createButton(title, cssClass, callback);
  this._footerButtons.push(button);

  this._renderFooterButtons();
};

Kamma.prototype._renderFooterContent = function () {
  if (this._modalFooter && this._footerContent) {
    this._modalFooter.innerHTML = this._footerContent;
  }
};

Kamma.prototype._renderFooterButtons = function () {
  if (this._modalFooter) {
    this._footerButtons.forEach((button) => {
      this._modalFooter.append(button);
    });
  }
};

Kamma.prototype._createButton = function (title, cssClass, callback) {
  const button = document.createElement("button");
  (button.className = cssClass),
    (button.innerHTML = title),
    (button.onclick = callback);

  return button;
};

Kamma.prototype.open = function () {
  Kamma.elements.push(this);
  if (!this._backdrop) {
    this._build();
  }
  setTimeout(() => {
    this._backdrop.classList.add("kamma--show");
  }, 0);

  // disable scrolling
  document.body.classList.add("kamma--no-scroll");
  document.body.style.paddingRight = this._getScrollbarWidth() + "px";

  // attach event listeners
  if (this._allowBackdropClose) {
    this._backdrop.onclick = (e) => {
      if (e.target === this._backdrop) {
        this.close();
      }
    };
  }

  if (this._allowEscapeClose) {
    document.addEventListener("keydown", this._handleEscapeKey);
  }

  this._ontransitionEnd(this.opt.onOpen);

  return this._backdrop;
};

Kamma.prototype._handleEscapeKey = function (e) {
  const lastModal = Kamma.elements[Kamma.elements.length - 1];
  if (e.key === "Escape" && this === lastModal) {
    this.close();
  }
};

Kamma.prototype._ontransitionEnd = function (callback) {
  this._backdrop.ontransitionend = (e) => {
    if (e.propertyName !== "transform") return;
    if (typeof callback === "function") callback();
  };
};

Kamma.prototype.close = function (destroy = this.opt.destroyOnClose) {
  Kamma.elements.pop();
  this._backdrop.classList.remove("kamma--show");

  if (this._allowEscapeClose) {
    document.removeEventListener("keydown", this._handleEscapeKey);
  }

  this._ontransitionEnd(() => {
    if (destroy && this._backdrop) {
      this._backdrop.remove();
      this._backdrop = null;
      this._modalFooter = null;
    }

    if (!Kamma.elements.length) {
      // enable scrolling
      document.body.classList.remove("kamma--no-scroll");
      document.body.style.paddingRight = "";
    }
    if (typeof this.opt.onClose === "function") this.opt.onClose();
  });
};

Kamma.prototype.destroy = function () {
  this.close(true);
};

Kamma.prototype._getScrollbarWidth = function () {
  if (this._scrollbarWidth) return this._scrollbarWidth;
  const div = document.createElement("div");
  Object.assign(div.style, {
    overflow: "scroll",
    position: "absolute",
    top: "-99999px",
  });

  document.body.appendChild(div);
  this._scrollbarWidth = div.offsetWidth - div.clientWidth;
  document.body.removeChild(div);

  return this._scrollbarWidth;
};
