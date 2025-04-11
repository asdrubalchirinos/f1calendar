// F1 Calendar Generator - API Data Fetching App
document.addEventListener('DOMContentLoaded', function() {
    // Load race data when the page loads
    loadRaceData();
    
    // Set up language buttons to refresh data when language changes
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setTimeout(loadRaceData, 100); // Short delay to ensure language has been updated
        });
    });
    
    // Set up iCal download button if it exists
    const icalBtn = document.getElementById('download-ical-btn');
    if (icalBtn) {
        icalBtn.addEventListener('click', generateAndDownloadIcal);
    }
});

// Store races globally to access for iCal generation
let cachedRaces = [];

async function loadRaceData() {
    const language = localStorage.getItem('language') || 'en';
    const racesContainer = document.getElementById('races-container');
    const googleCalRaces = document.getElementById('google-cal-races');
    
    if (!racesContainer && !googleCalRaces) return;
    
    // Show loading indicator
    const targetContainer = racesContainer || googleCalRaces;
    targetContainer.innerHTML = `
        <div id="loading-indicator" class="text-center py-5">
            <div class="spinner-border text-${racesContainer ? 'danger' : 'success'}" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">${language === 'en' ? 'Loading race data...' : 'Cargando datos de carreras...'}</p>
        </div>
    `;
    
    try {
        // Fetch data from F1API.dev instead of Ergast
        const response = await fetch('https://f1api.dev/api/current');
        const data = await response.json();
        
        // Get the current date for filtering past races
        const now = new Date();
                
        // Extract races array from the response
        const races = data.races;
                
        // Filter out past races
        const upcomingRaces = races.filter(race => {
            // Get race date and time from the new API structure
            const raceDate = race.schedule?.race?.date;
            const raceTime = race.schedule?.race?.time;
                    
            if (raceDate) {
                try {
                    const raceDateTime = new Date(`${raceDate}T${raceTime || '00:00:00Z'}`);
                    return raceDateTime > now;
                } catch (e) {
                    console.error('Error parsing race date:', e);
                    return true; // Keep races with parsing errors
                }
            }
            return true; // Keep races with missing date info
        });
        
        // Cache the races for iCal generation
        cachedRaces = upcomingRaces;
        
        // Render to the appropriate container
        if (racesContainer) {
            renderRacesTable(upcomingRaces, language);
        } else if (googleCalRaces) {
            renderGoogleCalRaces(upcomingRaces, language);
        }
        
        // Format dates after rendering
        setTimeout(formatDates, 100);
        
    } catch (error) {
        console.error('Error fetching race data:', error);
        targetContainer.innerHTML = `
            <div class="alert alert-danger">
                <h4>${language === 'en' ? 'Error Loading Data' : 'Error al Cargar Datos'}</h4>
                <p>${language === 'en' ? 'There was a problem loading the F1 race data. Please try again later.' : 'Hubo un problema al cargar los datos de carreras de F1. Por favor, inténtalo más tarde.'}</p>
            </div>
        `;
    }
}

function renderRacesTable(races, language) {
    const racesContainer = document.getElementById('races-container');
    
    if (races.length === 0) {
        racesContainer.innerHTML = `
            <div class="alert alert-info">
                <p>${language === 'en' ? 'No upcoming races are scheduled at the moment. Check back later!' : 'No hay carreras programadas en este momento. ¡Vuelve más tarde!'}</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-striped table-hover" id="races-table">
                <thead class="table-dark">
                    <tr>
                        <th>${language === 'en' ? 'Round' : 'Ronda'}</th>
                        <th>${language === 'en' ? 'Race Name' : 'Nombre de la Carrera'}</th>
                        <th>${language === 'en' ? 'Circuit' : 'Circuito'}</th>
                        <th>${language === 'en' ? 'Date & Time' : 'Fecha y Hora'}</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add rows for each race
    races.forEach(race => {
        const raceDate = race.schedule?.race?.date;
        const raceTime = race.schedule?.race?.time;
        
        html += `
            <tr>
                <td>${race.round}</td>
                <td>${race.raceName}</td>
                <td>${race.circuit?.circuitName || ''}</td>
                <td class="race-time" data-utc-date="${raceDate || ''}" data-utc-time="${raceTime || ''}">
                    <div class="formatted-date-time"></div>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    racesContainer.innerHTML = html;
}

function renderGoogleCalRaces(races, language) {
    const googleCalRaces = document.getElementById('google-cal-races');
    
    if (races.length === 0) {
        googleCalRaces.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle-fill"></i> 
                <span>${language === 'en' ? 'No upcoming races are scheduled at the moment. Check back later!' : 'No hay carreras programadas en este momento. ¡Vuelve más tarde!'}</span>
            </div>
        `;
        return;
    }
    
    let html = '<div class="list-group">';
    
    races.forEach((race, index) => {
        // Get race name and circuit
        const raceName = race.raceName;
        const circuitName = race.circuit?.circuitName || '';
        const raceDate = race.schedule?.race?.date || '';
        const raceTime = race.schedule?.race?.time || '';
        
        // Pre-calculate dates for Google Calendar
        let calendarUrl = "#";
        if (raceDate) {
            try {
                // Format dates for Google Calendar
                const formattedDates = formatDatesForGoogleCalendar(raceDate, raceTime);
                
                // Format location
                let location = circuitName || "";
                if (race.circuit?.city && race.circuit?.country) {
                    location += `, ${race.circuit.city}, ${race.circuit.country}`;
                }
                
                // Create the URL directly with all parameters
                const textParam = encodeURIComponent('F1: ' + raceName);
                const datesParam = formattedDates;
                const detailsParam = encodeURIComponent('Round ' + race.round + ' of the Formula 1 Season');
                const locationParam = encodeURIComponent(location);
                // Add timestamp to prevent caching
                const cacheBuster = new Date().getTime();
                calendarUrl = 'https://www.google.com/calendar/render?action=TEMPLATE&text=' + textParam + '&dates=' + datesParam + '&details=' + detailsParam + '&location=' + locationParam + '&cacheKey=' + cacheBuster;
            } catch (error) {
                console.error('Error creating calendar URL:', error);
            }
        }
        
        // Add link for each race
        html += `
            <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${language === 'en' ? 'Round' : 'Ronda'} ${race.round}: ${raceName}</h5>
                    <span class="badge bg-danger rounded-pill">${language === 'en' ? 'Round' : 'Ronda'} ${race.round}</span>
                </div>
                <p class="mb-1">
                    <i class="bi bi-geo-alt-fill text-muted"></i> ${circuitName}
                    ${race.circuit?.country ? ` - ${race.circuit.country}` : ''}
                </p>
                <div class="d-flex w-100 justify-content-between align-items-center">
                    <div class="race-time" data-utc-date="${raceDate}" data-utc-time="${raceTime}">
                        <div class="formatted-date-time"></div>
                    </div>
                    <a href="${calendarUrl}" class="btn btn-primary btn-sm" target="_blank" rel="noopener">
                        <i class="bi bi-plus-circle"></i> ${language === 'en' ? 'Add to Calendar' : 'Añadir al Calendario'}
                    </a>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    googleCalRaces.innerHTML = html;
}

function formatDates() {
    const language = localStorage.getItem('language') || 'en';
    const raceTimes = document.querySelectorAll('.race-time');
    
    if (raceTimes.length === 0) {
        return;
    }
    
    // Get month and day names in the correct language
    const dateFormatter = new Intl.DateTimeFormat(language, { month: 'long' });
    const dayFormatter = new Intl.DateTimeFormat(language, { weekday: 'long' });
    
    raceTimes.forEach(function(timeCell) {
        const utcDate = timeCell.getAttribute('data-utc-date');
        const utcTime = timeCell.getAttribute('data-utc-time');
        
        if (utcDate) {
            try {
                // Parse the UTC date and time
                const utcDateTime = new Date(`${utcDate}T${utcTime || '00:00:00Z'}`);
                
                // Check if date is valid
                if (isNaN(utcDateTime.getTime())) {
                    console.error('Invalid date:', utcDate, utcTime);
                    timeCell.innerHTML = '<div class="text-danger">Invalid date format</div>';
                    return;
                }
                
                // Format local time
                const formattedElement = timeCell.querySelector('.formatted-date-time');
                
                if (formattedElement) {
                    // Format date in user's language
                    const dayName = dayFormatter.format(utcDateTime);
                    const day = utcDateTime.getDate();
                    const month = dateFormatter.format(utcDateTime);
                    const year = utcDateTime.getFullYear();
                    
                    // Format time (12-hour format with AM/PM)
                    let hours = utcDateTime.getHours();
                    const minutes = utcDateTime.getMinutes().toString().padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12; // Convert 0 to 12
                    
                    // Get timezone
                    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    
                    // Create human-readable format with language-specific formatting
                    let dateHtml = '';
                    
                    if (language === 'es') {
                        dateHtml = `
                            <div class="race-date">
                                <i class="bi bi-calendar-event text-danger"></i>
                                <strong>${dayName}, ${day} de ${month} de ${year}</strong>
                            </div>
                            <div class="race-time-display mt-1">
                                <i class="bi bi-clock text-success"></i>
                                <span>${hours}:${minutes} ${ampm}</span>
                                <small class="text-muted">(${timezone})</small>
                            </div>
                        `;
                    } else {
                        dateHtml = `
                            <div class="race-date">
                                <i class="bi bi-calendar-event text-danger"></i>
                                <strong>${dayName}, ${month} ${day}, ${year}</strong>
                            </div>
                            <div class="race-time-display mt-1">
                                <i class="bi bi-clock text-success"></i>
                                <span>${hours}:${minutes} ${ampm}</span>
                                <small class="text-muted">(${timezone})</small>
                            </div>
                        `;
                    }
                    
                    formattedElement.innerHTML = dateHtml;
                }
            } catch (e) {
                console.error('Error converting time:', e);
                timeCell.innerHTML = '<div class="text-danger">Error formatting date</div>';
            }
        } else {
            timeCell.textContent = language === 'en' ? 'TBA' : 'Por confirmar';
        }
    });
}

// Helper function to format dates for Google Calendar
function formatDatesForGoogleCalendar(dateStr, timeStr) {
    const startDate = new Date(`${dateStr}T${timeStr || '00:00:00Z'}`);
    
    // Start time
    const startYear = startDate.getUTCFullYear();
    const startMonth = (startDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const startDay = startDate.getUTCDate().toString().padStart(2, '0');
    const startHours = startDate.getUTCHours().toString().padStart(2, '0');
    const startMinutes = startDate.getUTCMinutes().toString().padStart(2, '0');
    const startSeconds = startDate.getUTCSeconds().toString().padStart(2, '0');
    const startTime = `${startYear}${startMonth}${startDay}T${startHours}${startMinutes}${startSeconds}Z`;
    
    // End time is 2 hours later
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000));
    const endYear = endDate.getUTCFullYear();
    const endMonth = (endDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const endDay = endDate.getUTCDate().toString().padStart(2, '0');
    const endHours = endDate.getUTCHours().toString().padStart(2, '0');
    const endMinutes = endDate.getUTCMinutes().toString().padStart(2, '0');
    const endSeconds = endDate.getUTCSeconds().toString().padStart(2, '0');
    const endTime = `${endYear}${endMonth}${endDay}T${endHours}${endMinutes}${endSeconds}Z`;
    
    // Return the formatted dates string for Google Calendar
    return `${startTime}/${endTime}`;
}

// Function to generate and download an iCal file
function generateAndDownloadIcal() {
    if (cachedRaces.length === 0) {
        const language = localStorage.getItem('language') || 'en';
        alert(language === 'en' ? 'No upcoming races found. Please try again later.' : 'No se encontraron próximas carreras. Por favor, inténtelo de nuevo más tarde.');
        return;
    }
    
    // Start building the iCal content
    let icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//F1CalendarGenerator//F1API//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Formula 1 Calendar',
        'X-WR-TIMEZONE:UTC',
        'X-WR-CALDESC:Formula 1 Race Calendar'
    ];
    
    // Add each race
    cachedRaces.forEach(race => {
        const raceDate = race.schedule?.race?.date;
        const raceTime = race.schedule?.race?.time || '00:00:00Z';
        
        if (!raceDate) return; // Skip races without dates
        
        // Calculate start and end times
        const startDate = new Date(`${raceDate}T${raceTime}`);
        const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // 2 hours later
        
        // Format dates for iCal
        const start = formatDateForIcal(startDate);
        const end = formatDateForIcal(endDate);
        
        // Create unique ID
        const uid = `race-${race.round}-${race.raceId || Math.random().toString(36).substring(2, 15)}@f1calendar.com`;
        
        // Location
        let location = race.circuit?.circuitName || '';
        if (race.circuit?.city && race.circuit?.country) {
            location += `, ${race.circuit.city}, ${race.circuit.country}`;
        }
        
        // Add event to calendar
        icalContent = icalContent.concat([
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${formatDateForIcal(new Date())}`,
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `SUMMARY:F1: ${race.raceName}`,
            `DESCRIPTION:Round ${race.round} of the Formula 1 Season`,
            `LOCATION:${escapeIcalText(location)}`,
            'END:VEVENT'
        ]);
        
        // Add qualifying session if available
        if (race.schedule?.qualy?.date) {
            const qualyDate = race.schedule.qualy.date;
            const qualyTime = race.schedule.qualy.time || '00:00:00Z';
            
            const qualyStart = new Date(`${qualyDate}T${qualyTime}`);
            const qualyEnd = new Date(qualyStart.getTime() + (1 * 60 * 60 * 1000)); // 1 hour later
            
            const qualyUid = `qualy-${race.round}-${race.raceId || Math.random().toString(36).substring(2, 15)}@f1calendar.com`;
            
            icalContent = icalContent.concat([
                'BEGIN:VEVENT',
                `UID:${qualyUid}`,
                `DTSTAMP:${formatDateForIcal(new Date())}`,
                `DTSTART:${formatDateForIcal(qualyStart)}`,
                `DTEND:${formatDateForIcal(qualyEnd)}`,
                `SUMMARY:F1: ${race.raceName} - Qualifying`,
                `DESCRIPTION:Qualifying session for Round ${race.round} of the Formula 1 Season`,
                `LOCATION:${escapeIcalText(location)}`,
                'END:VEVENT'
            ]);
        }
        
        // Add sprint race if available
        if (race.schedule?.sprintRace?.date) {
            const sprintDate = race.schedule.sprintRace.date;
            const sprintTime = race.schedule.sprintRace.time || '00:00:00Z';
            
            const sprintStart = new Date(`${sprintDate}T${sprintTime}`);
            const sprintEnd = new Date(sprintStart.getTime() + (1 * 60 * 60 * 1000)); // 1 hour later
            
            const sprintUid = `sprint-${race.round}-${race.raceId || Math.random().toString(36).substring(2, 15)}@f1calendar.com`;
            
            icalContent = icalContent.concat([
                'BEGIN:VEVENT',
                `UID:${sprintUid}`,
                `DTSTAMP:${formatDateForIcal(new Date())}`,
                `DTSTART:${formatDateForIcal(sprintStart)}`,
                `DTEND:${formatDateForIcal(sprintEnd)}`,
                `SUMMARY:F1: ${race.raceName} - Sprint Race`,
                `DESCRIPTION:Sprint Race for Round ${race.round} of the Formula 1 Season`,
                `LOCATION:${escapeIcalText(location)}`,
                'END:VEVENT'
            ]);
        }
    });
    
    // Close the calendar
    icalContent.push('END:VCALENDAR');
    
    // Join with CRLF line breaks (iCal standard)
    const icalData = icalContent.join('\r\n');
    
    // Create a blob and trigger download
    const blob = new Blob([icalData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    // Add timestamp to filename to prevent caching
    const timestamp = new Date().getTime();
    link.download = `f1_calendar_${timestamp}.ics`;
    // Set other attributes for proper handling
    link.setAttribute('type', 'text/calendar');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Helper function to format date for iCal
function formatDateForIcal(date) {
    // Format: YYYYMMDDTHHMMSSZ (RFC 5545 standard)
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

// Helper function to escape text for iCal
function escapeIcalText(text) {
    if (!text) return '';
    return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
} 