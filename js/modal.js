/* Modal dialog JS */
let firstTabStop = null;
let lastTabStop = null;
let modal = null;
let focusOnExit = null;

function openModal (dlgId, lastFocusedElement) {
    focusOnExit = lastFocusedElement;
    modal = document.getElementById(dlgId);
    modal.style.display = "block";
    
    const btnClose = modal.getElementsByClassName('modal-button-danger')[0];
    
    // When the user clicks on cancel buttom, close the modal
    btnClose.addEventListener('click', function() {
        closeModal();
    });
    
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = event => {
        if (event.target == modal) closeModal();
    }
    // When user press escape, close the modal
    document.onkeydown = event => {
        if (event.keyCode === 27) closeModal();
    }
    modal.addEventListener('keydown', trapTabKey);
    
    // focusable elements in modal
    const focusableElementsString = 'button, input[text]';
    let focusableElements = modal.querySelectorAll(focusableElementsString);
    // convert nodelist to array
    focusableElements = Array.prototype.slice.call(focusableElements);
    
    firstTabStop = focusableElements[0];
    lastTabStop = focusableElements[focusableElements.length - 1];
    
    // focusing on first stop
    firstTabStop.focus();
}


function trapTabKey(e) {
    // first tab pressed
    if (e.keyCode === 9) {
        // shift + tab pressed
        if (e.shiftKey) {
            if (document.activeElement === firstTabStop) {
                e.preventDefault();
                lastTabStop.focus();
            }
        } else {
        // tab pressed
            if (document.activeElement === lastTabStop) {
                e.preventDefault();
                firstTabStop.focus();
            }
        }
    }

}

closeModal = () => {
    modal.style.display = "none";
    focusOnExit.focus();
}