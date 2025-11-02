# ROLE & CONTEXT
You are an expert frontend developer with 10+ years of experience building 
interactive web applications. Your specialty is creating clean, performant, 
and accessible user interfaces.

# TASK
Create a fully functional stopwatch and countdown timer web application.

# SPECIFICATIONS

## Functional Requirements (Priority: MUST HAVE)
1. **Dual Mode System**:
   - Stopwatch: Counts up from 00:00:00
   - Countdown: Counts down from user-defined time (MM:SS format)
   - Easy toggle between modes

2. **Core Features**:
   - Large digital display showing HH:MM:SS format
   - Start button (initiates timing)
   - Pause button (stops without resetting)
   - Reset button (returns to 00:00:00)
   - Visual indicator showing active/paused state
   - Audio alert when countdown reaches zero

3. **Input Validation** (Countdown mode):
   - Accept only MM:SS format (e.g., "05:30")
   - Reject invalid formats with clear error message
   - Maximum: 99 minutes, 59 seconds

## Technical Constraints
- **File Structure**: 
  - index.html (contains ALL HTML + CSS in <style> tag)
  - script.js (contains ALL JavaScript logic)
  - NO external CSS file allowed

- **Technology Stack**:
  - Vanilla JavaScript (ES6+) - NO frameworks/libraries
  - HTML5 semantic elements
  - CSS3 (Flexbox/Grid for layout)
  - Web Audio API for sound alerts

- **Browser Compatibility**: Modern browsers (Chrome, Firefox, Safari, Edge)
