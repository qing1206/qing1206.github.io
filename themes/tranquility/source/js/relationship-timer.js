(function() {
    // Set the date when your relationship started (format: YYYY-MM-DD)
    const startDate = new Date('2024-12-06T23:00:00'); // Change this to your actual date
    
    function updateTimer() {
      const now = new Date();
      const diff = now - startDate;
      
      // Calculate days, hours, minutes, seconds
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // Update the HTML elements with animation
      updateDigit('timer-days', days);
      updateDigit('timer-hours', hours.toString().padStart(2, '0'));
      updateDigit('timer-minutes', minutes.toString().padStart(2, '0'));
      updateDigit('timer-seconds', seconds.toString().padStart(2, '0'));
    }
    
    function updateDigit(id, value) {
      const element = document.getElementById(id);
      if (element.textContent !== value.toString()) {
        element.classList.add('digit-update');
        setTimeout(() => {
          element.textContent = value;
          element.classList.remove('digit-update');
        }, 300);
      } else {
        element.textContent = value;
      }
    }
    
    // Update the timer immediately and then every second
    updateTimer();
    setInterval(updateTimer, 1000);
  })();