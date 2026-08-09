if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

const introScreen = document.getElementById('introScreen');
const redScreen = document.getElementById('redScreen');
const blueScreen = document.getElementById('blueScreen');
const startButton = document.querySelector('.start-button');
const foldRight = document.querySelector('.fold-right');
const foldLeft = document.querySelector('.fold-left');
const screenLinks = document.querySelectorAll('.screen-link');

let dragState = null;

function transitionScreens(fromScreen, toScreen, direction) {
    if (!fromScreen || !toScreen) return;

    if (direction === 'down') {
        toScreen.classList.add('active', 'slide-down');
        toScreen.addEventListener('animationend', function handler() {
            fromScreen.classList.remove('active');
            toScreen.classList.remove('slide-down');
            toScreen.removeEventListener('animationend', handler);
        });
        return;
    }

    const animationClass = direction === 'right' ? 'turn-right' : 'turn-left';
    fromScreen.classList.add(animationClass);
    fromScreen.addEventListener('animationend', function handler() {
        fromScreen.classList.remove('active', animationClass);
        toScreen.classList.add('active');
        fromScreen.removeEventListener('animationend', handler);
    });
}

function clearBubbleText(event) {
    const button = event.currentTarget;
    const bubble = button.closest('.bubble-item')?.querySelector('.bubble');
    if (!bubble) return;
    bubble.textContent = '';
    bubble.focus();
}

function updateBubbleActions() {
    document.querySelectorAll('.bubble-delete').forEach(button => {
        button.addEventListener('click', clearBubbleText);
    });

    document.querySelectorAll('.bubble-handle').forEach(handle => {
        handle.addEventListener('pointerdown', startDrag);
    });
}

function startDrag(event) {
    event.preventDefault();
    const handle = event.currentTarget;
    const item = handle.closest('.bubble-item');
    const grid = item?.parentElement;
    if (!item || !grid) return;

    const rect = item.getBoundingClientRect();
    const clone = item.cloneNode(true);
    clone.classList.add('bubble-clone');
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.pointerEvents = 'none';
    document.body.appendChild(clone);

    const placeholder = document.createElement('div');
    placeholder.className = 'bubble-placeholder';
    placeholder.style.height = `${rect.height}px`;
    placeholder.style.width = `${rect.width}px`;
    placeholder.style.margin = getComputedStyle(item).margin;

    item.classList.add('dragging');
    grid.insertBefore(placeholder, item.nextSibling);
    item.style.visibility = 'hidden';

    dragState = {
        item,
        grid,
        clone,
        placeholder,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    document.addEventListener('pointermove', onDragMove);
    document.addEventListener('pointerup', endDrag);
}

function onDragMove(event) {
    if (!dragState) return;
    event.preventDefault();

    const { clone, placeholder, grid, offsetX, offsetY } = dragState;
    clone.style.left = `${event.clientX - offsetX}px`;
    clone.style.top = `${event.clientY - offsetY}px`;

    const elementBelow = document.elementFromPoint(event.clientX, event.clientY);
    if (!elementBelow) return;

    const overItem = elementBelow.closest('.bubble-item');
    if (!overItem || overItem === dragState.item || overItem === placeholder || overItem.parentElement !== grid) {
        return;
    }

    const overRect = overItem.getBoundingClientRect();
    const insertBefore = event.clientY < overRect.top + overRect.height / 2;
    if (insertBefore) {
        grid.insertBefore(placeholder, overItem);
    } else {
        grid.insertBefore(placeholder, overItem.nextSibling);
    }
}

function endDrag(event) {
    if (!dragState) return;
    const { item, grid, placeholder, clone } = dragState;
    grid.insertBefore(item, placeholder);
    item.classList.remove('dragging');
    item.style.visibility = '';
    placeholder.remove();
    clone.remove();
    document.removeEventListener('pointermove', onDragMove);
    document.removeEventListener('pointerup', endDrag);
    dragState = null;
}

startButton.addEventListener('click', () => {
    transitionScreens(introScreen, redScreen, 'right');
});

foldRight.addEventListener('click', () => {
    transitionScreens(redScreen, blueScreen, 'right');
});

foldLeft.addEventListener('click', () => {
    transitionScreens(blueScreen, redScreen, 'left');
});

screenLinks.forEach(link => {
    link.addEventListener('click', () => {
        transitionScreens(redScreen.classList.contains('active') ? redScreen : blueScreen, introScreen, 'down');
    });
});

updateBubbleActions();
