export class Utility {
  static show(elements) {
    let element, index;

    if (elements) {
      elements = elements.length ? elements : [elements];
      for (index = 0; index < elements.length; index++) {
        element = elements[index];
        element.classList.remove('hidden');
      }
    }
  }

  static hide(elements) {
    let element, index;

    if (elements) {
      elements = elements.length ? elements : [elements];
      for (index = 0; index < elements.length; index++) {
        element = elements[index];
        element.classList.add('hidden');
      }
    }
  }

  static popMsg(msg, config = null) {
    const popup = document.createElement('div');

    const text = document.createElement('span');
    text.textContent = msg;
    text.classList.add('popup-msg');

    const close = document.createElement('span');
    close.innerHTML = '&#10006;';
    close.setAttribute('role', 'button');
    close.classList.add('popup-close');

    popup.appendChild(text);
    popup.appendChild(close);
    popup.classList.add('popup', 'popup-anim-in');

    close.addEventListener('click', (e) => {
      popup.classList.remove('popup-anim-in');
      popup.classList.add('popup-anim-out');
      const removePopup = () =>
        e.target ? e.target.parentNode.remove() : null;

      setTimeout(removePopup, 100);
    });

    const wrapper = document.getElementById('popup-wrapper');
    wrapper.prepend(popup);

    if (config) {
      if (config.auto_close === true) {
        const closeAfter =
          config.close_after && config.close_after > 0
            ? config.close_after
            : 5000;
        setTimeout(() => close.click(), closeAfter);
      }
    }
  }

  static executeAfterCountdown(callback, duration) {
    let stop = false;
    const start = Date.now() + duration * 1000;

    function update() {
      const timer = countdown(start);
      const seconds = timer.toString().replace(' seconds', '');

      if (seconds > 0 && !stop) {
        document.getElementById('seconds').textContent = seconds;

        requestAnimationFrame(update);
      } else {
        document.getElementById('seconds').textContent = '30';

        // only execute callback if not explicitly stopped
        if (!stop) {
          callback();
        }
      }
    }

    update();

    return {
      reset: function () {
        stop = true;
      },
    };
  }

  static delay(callback, ms) {
    let timer = 0;

    return function () {
      const context = this,
        args = arguments;

      clearTimeout(timer);

      timer = setTimeout(function () {
        callback.apply(context, args);
      }, ms || 0);
    };
  }
}
