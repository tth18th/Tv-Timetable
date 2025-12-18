/**
 * PRAYER TIMES DASHBOARD - TV DISPLAY
 * Enhanced Version with Dual Popups (Adhan & Jama'ah)
 * Removed Call Column, Added Responsive Time Fonts
 */

class PrayerTimesDashboard {
    constructor() {
        // Time and date variables
        this.currentDate = new Date();
        this.currentYear = this.currentDate.getFullYear();
        this.currentMonth = this.currentDate.getMonth() + 1;

        // Prayer data variables
        this.prayerData = {};
        this.todayData = null;
        this.tomorrowData = null;
        this.currentPrayerIndex = -1;
        this.nextPrayerIndex = -1;

        // Jumu'ah (Friday) variables
        this.showJumuahNotice = false;
        this.jumuahTime = null;
        this.jumuahHighlightActive = false;

        // Slideshow variables
        this.slideshowImages = [];
        this.currentImageIndex = 0;
        this.isSlideshowActive = false;
        this.slideshowHideTimeout = null;
        this.slideshowCycleInterval = null;

        // Call for prayer variables - DUAL SYSTEM
        this.adhanOverlayActive = false;
        this.jamaahOverlayActive = false;
        this.adhanTimer = null;
        this.jamaahTimer = null;
        this.adhanCountdown = 0;
        this.jamaahCountdown = 0;
        this.currentAdhanPrayer = null;
        this.currentJamaahPrayer = null;

        // Footer hide variables
        this.footerHidden = false;
        this.footerHideTimeout = null;

        // DOM Elements - Updated for dual popups
        this.elements = {
            loadingScreen: document.getElementById('loading-screen'),
            container: document.querySelector('.container'),
            currentTime: document.getElementById('current-time'),
            currentSeconds: document.getElementById('current-seconds'),
            dayName: document.getElementById('day-name'),
            fullDate: document.getElementById('full-date'),
            hijriDate: document.getElementById('hijri-date'),
            lastUpdate: document.getElementById('last-update'),
            currentMonth: document.getElementById('current-month'),
            prayerRows: document.getElementById('prayer-rows'),
            nextPrayerName: document.getElementById('next-prayer-name'),
            nextPrayerTime: document.getElementById('next-prayer-time'),
            nextPrayerCountdown: document.getElementById('next-prayer-countdown'),
            nextPrayerHighlight: document.getElementById('next-prayer-highlight'),
            slideshowPopup: document.getElementById('slideshow-popup'),
            slideshowImage: document.getElementById('slideshow-image'),
            slideshowCaption: document.getElementById('slideshow-caption'),
            imageCounter: document.getElementById('image-counter'),
            slideshowTimerBar: document.getElementById('slideshow-timer-bar'),
            slideshowStatus: document.getElementById('slideshow-status'),
            dataStatus: document.getElementById('data-status'),
            adhanOverlay: document.getElementById('adhan-overlay'),
            adhanPrayerName: document.getElementById('adhan-prayer-name'),
            adhanCountdown: document.getElementById('adhan-countdown'),
            jamaahOverlay: document.getElementById('jamaah-overlay'),
            jamaahPrayerName: document.getElementById('jamaah-prayer-name'),
            jamaahCountdown: document.getElementById('jamaah-countdown'),
            prevMonthBtn: document.getElementById('prev-month-btn'),
            nextMonthBtn: document.getElementById('next-month-btn'),
            footerToggleBtn: document.getElementById('footer-toggle-btn'),
            footer: document.getElementById('footer')
        };

        // Prayer configuration
        this.prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        this.prayerIcons = {
            'Fajr': 'fas fa-sun',
            'Dhuhr': 'fas fa-sun',
            'Asr': 'fas fa-cloud-sun',
            'Maghrib': 'bi bi-sunset',
            'Isha': 'fas fa-moon'
        };
        this.prayerNames = {
            'Fajr': 'FAJR',
            'Dhuhr': 'DHUHR',
            'Asr': 'ASR',
            'Maghrib': 'MAGHRIB',
            'Isha': 'ISHA'
        };

        // Initialize dashboard
        this.init();
    }

    /**
     * INITIALIZE DASHBOARD
     * Main initialization function
     */
    async init() {
        console.log('🚀 Initializing Prayer Times Dashboard...');

        try {
            // Hide loading screen after 1 second minimum
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 1000);

            // Load data and images in parallel
            await Promise.all([
                this.loadPrayerData(),
                this.loadSlideshowImages()
            ]);

            // Initialize display and timers
            this.updateDateTime();
            this.updateDisplay();
            this.setupEventListeners();
            this.setupTimers();
            this.startSlideshowCycle();
            this.setupFooterAutoHide();
            this.enterTVMode();

            console.log('✅ Dashboard ready');

        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showError('Failed to initialize dashboard. Using fallback mode.');
            this.hideLoadingScreen();
        }
    }

    /**
     * HIDE LOADING SCREEN
     * Transition from loading screen to main dashboard
     */
    hideLoadingScreen() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.style.opacity = '0';
            this.elements.loadingScreen.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                this.elements.loadingScreen.style.display = 'none';
                if (this.elements.container) {
                    this.elements.container.style.display = 'flex';
                }
            }, 500);
        }
    }

    /**
     * SHOW ERROR
     * Display error message and update status
     */
    showError(message) {
        console.error('Dashboard Error:', message);
        this.elements.dataStatus.classList.remove('warning', 'active');
        this.elements.dataStatus.classList.add('inactive');
        this.elements.dataStatus.querySelector('span').textContent = 'Data: Error';
    }

    /**
     * ENTER TV MODE
     * Enable fullscreen and TV-specific features
     */
    enterTVMode() {
        // Add TV mode class
        document.body.classList.add('tv-mode');

        // Prevent context menu
        document.addEventListener('contextmenu', e => {
            e.preventDefault();
            return false;
        });

        // Prevent F11 default behavior
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                this.requestFullscreen();
            }
        });

        // Attempt fullscreen
        this.requestFullscreen();
    }

    /**
     * REQUEST FULLSCREEN
     * Attempt to enter fullscreen mode
     */
    requestFullscreen() {
        const elem = document.documentElement;

        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(e => {
                    console.log('Fullscreen not allowed:', e);
                    this.fallbackFullscreen();
                });
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            } else {
                this.fallbackFullscreen();
            }
        }
    }

    /**
     * FALLBACK FULLSCREEN
     * CSS-based fallback for browsers without fullscreen API
     */
    fallbackFullscreen() {
        document.body.style.position = 'fixed';
        document.body.style.top = '0';
        document.body.style.left = '0';
        document.body.style.width = '100vw';
        document.body.style.height = '100vh';
        document.body.style.margin = '0';
        document.body.style.padding = '15px';
        document.body.style.overflow = 'hidden';
        document.body.style.zIndex = '9999';

        document.documentElement.style.overflow = 'hidden';
        window.dispatchEvent(new Event('resize'));
    }

    /**
     * LOAD SLIDESHOW IMAGES
     * Load images for slideshow from various sources
     */
    async loadSlideshowImages() {
        try {
            // Try to load from API first
            const response = await fetch('/api/images');
            if (response.ok) {
                const data = await response.json();
                this.slideshowImages = data.images || data;
                this.updateSlideshowStatus(`Slideshow: ${this.slideshowImages.length} images`, 'active');
                return;
            }
        } catch (error) {
            console.log('API images not available, trying embedded images...');
        }

        // Try embedded images
        if (window.EMBEDDED_IMAGES && window.EMBEDDED_IMAGES.length > 0) {
            this.slideshowImages = window.EMBEDDED_IMAGES;
            this.updateSlideshowStatus(`Slideshow: ${this.slideshowImages.length} embedded images`, 'active');
            return;
        }

        // Try to load from images list file
        try {
            const response = await fetch('images_list.json');
            if (response.ok) {
                const data = await response.json();
                this.slideshowImages = data.images || data;
                this.updateSlideshowStatus(`Slideshow: ${this.slideshowImages.length} images from file`, 'active');
                return;
            }
        } catch (error) {
            console.log('Images list file not found');
        }

        // Use default images
        this.slideshowImages = [
            { src: 'images/mosque1.jpg', caption: 'Baitul Mukarram Jame Mosque' },
            { src: 'images/mosque2.jpg', caption: 'Prayer Hall Interior' },
            { src: 'images/quran.jpg', caption: 'Holy Quran' },
            { src: 'images/islamic_art.jpg', caption: 'Islamic Art & Architecture' },
            { src: 'images/prayer_mat.jpg', caption: 'Prayer Time' }
        ];

        this.updateSlideshowStatus('Slideshow: Default images', 'warning');
    }

    /**
     * UPDATE SLIDESHOW STATUS
     * Update status indicator for slideshow
     */
    updateSlideshowStatus(text, status) {
        const statusEl = this.elements.slideshowStatus;
        statusEl.classList.remove('active', 'warning', 'inactive');
        statusEl.classList.add(status);
        statusEl.querySelector('span').textContent = text;
    }

    /**
     * LOAD PRAYER DATA
     * Load prayer times from JSON file or embedded data
     */
    async loadPrayerData() {
        const month = String(this.currentMonth).padStart(2, '0');
        const fileName = `jamaah_times_${this.currentYear}_${month}.json`;
        const dataKey = `${this.currentYear}_${month}`;

        try {
            // Try embedded data first
            if (window.EMBEDDED_PRAYER_DATA && window.EMBEDDED_PRAYER_DATA[dataKey]) {
                this.prayerData = window.EMBEDDED_PRAYER_DATA[dataKey].prayer_times ||
                                 window.EMBEDDED_PRAYER_DATA[dataKey];
                this.updateTodayAndTomorrowData();
                this.updateDataStatus('Data: Embedded', 'active');
                return;
            }

            // Try to fetch from server
            try {
                const response = await fetch(`data/${fileName}?t=${Date.now()}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                this.prayerData = data.prayer_times || data;
                this.updateTodayAndTomorrowData();
                this.updateDataStatus('Data: Live', 'active');
                return;
            } catch (fetchError) {
                console.log('Server fetch failed, trying fallback...');
            }

            // Use fallback data
            throw new Error('No data source available');

        } catch (error) {
            console.log('Using fallback data');
            this.loadFallbackData();
            this.updateDataStatus('Data: Fallback', 'warning');
        }
    }

    /**
     * UPDATE DATA STATUS
     * Update status indicator for data loading
     */
    updateDataStatus(text, status) {
        const statusEl = this.elements.dataStatus;
        statusEl.classList.remove('active', 'warning', 'inactive');
        statusEl.classList.add(status);
        statusEl.querySelector('span').textContent = text;
    }

    /**
     * LOAD FALLBACK DATA
     * Load fallback prayer times when no data is available
     */
    loadFallbackData() {
        const today = this.formatDate(new Date());
        const tomorrow = this.formatDate(new Date(Date.now() + 86400000));
        const now = new Date();
        const isFriday = now.getDay() === 5;

        // Base times
        const baseTimes = {
            'Fajr': '06:15',
            'Sunrise': '08:35',
            'Dhuhr': '12:20',
            'Asr': '13:45',
            'Maghrib': '15:45',
            'Isha': '17:30'
        };

        this.prayerData = {
            [today]: {
                date: today,
                day_number: now.getDate(),
                day_name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()],
                is_friday: isFriday,
                has_custom_times: false,
                beginning_times: baseTimes,
                jamaah_times: {
                    Fajr_Jamaah: '06:45',
                    Dhuhr_Jamaah: '13:00',
                    Asr_Jamaah: '14:15',
                    Maghrib_Jamaah: '15:50',
                    Isha_Jamaah: '18:00',
                    ...(isFriday ? { Jumuah: '13:15' } : {})
                }
            },
            [tomorrow]: {
                date: tomorrow,
                day_number: new Date(Date.now() + 86400000).getDate(),
                day_name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(now.getDay() + 1) % 7],
                is_friday: (now.getDay() + 1) % 7 === 5,
                has_custom_times: false,
                beginning_times: {
                    'Fajr': '06:20',
                    'Sunrise': '08:40',
                    'Dhuhr': '12:20',
                    'Asr': '13:45',
                    'Maghrib': '15:50',
                    'Isha': '17:35'
                },
                jamaah_times: {
                    Fajr_Jamaah: '06:50',
                    Dhuhr_Jamaah: '13:00',
                    Asr_Jamaah: '14:15',
                    Maghrib_Jamaah: '15:55',
                    Isha_Jamaah: '18:05',
                    ...((now.getDay() + 1) % 7 === 5 ? { Jumuah: '13:15' } : {})
                }
            }
        };

        this.updateTodayAndTomorrowData();
    }

    /**
     * UPDATE TODAY AND TOMORROW DATA
     * Set today's and tomorrow's prayer data
     */
    updateTodayAndTomorrowData() {
        const todayKey = this.formatDate(new Date());
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = this.formatDate(tomorrow);

        this.todayData = this.prayerData[todayKey];
        this.tomorrowData = this.prayerData[tomorrowKey];

        // If today's data not found, find the closest available date
        if (!this.todayData) {
            const dates = Object.keys(this.prayerData);
            if (dates.length > 0) {
                const sortedDates = dates.sort();
                for (const date of sortedDates) {
                    if (date >= todayKey) {
                        this.todayData = this.prayerData[date];
                        break;
                    }
                }
                if (!this.todayData) {
                    this.todayData = this.prayerData[sortedDates[sortedDates.length - 1]];
                }
            }
        }

        // If tomorrow's data not found, find the next available date
        if (!this.tomorrowData) {
            const dates = Object.keys(this.prayerData).sort();
            const todayIndex = dates.indexOf(todayKey);
            if (todayIndex !== -1 && todayIndex + 1 < dates.length) {
                this.tomorrowData = this.prayerData[dates[todayIndex + 1]];
            } else if (dates.length > 0) {
                this.tomorrowData = this.prayerData[dates[0]];
            }
        }
    }

    /**
     * UPDATE DATE TIME
     * Update current time, date, and Hijri date displays
     */
    updateDateTime() {
        const now = new Date();

        // Update time with Technology font
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        this.elements.currentTime.textContent = `${hours}:${minutes}`;
        this.elements.currentSeconds.textContent = `:${seconds}`;

        // Update date
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

        this.elements.dayName.textContent = dayNames[now.getDay()];
        this.elements.fullDate.textContent = `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

        // Update Hijri date
        this.updateHijriDate(now);

        // Update month display
        this.elements.currentMonth.textContent = `${monthNames[this.currentMonth - 1].toUpperCase()} ${this.currentYear}`;

        // Update last update time with Technology font
        this.elements.lastUpdate.textContent = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * UPDATE HIJRI DATE
     * Calculate and display Hijri date
     */
    updateHijriDate(gregorianDate) {
        const hijriYear = 1446;
        const hijriMonths = ['Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
                            'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
                            'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'];

        const monthIndex = gregorianDate.getMonth();
        const day = gregorianDate.getDate();

        const hijriDay = Math.max(1, (day % 30) + 1);
        const hijriMonthIndex = monthIndex % 12;

        this.elements.hijriDate.innerHTML =
            `<i class="fas fa-star-and-crescent"></i>
             <span>${hijriDay} ${hijriMonths[hijriMonthIndex]} ${hijriYear} AH</span>`;
    }

    /**
     * UPDATE DISPLAY
     * Update all dashboard displays
     */
    updateDisplay() {
        if (!this.todayData || !this.tomorrowData) {
            this.showLoadingState();
            return;
        }

        this.updatePrayerStatus();
        this.checkJumuahStatus();
        this.renderPrayerTimes();
        this.updateNextPrayer();
        this.checkCallForPrayer(); // Check for both Adhan and Jama'ah calls
    }

    /**
     * SHOW LOADING STATE
     * Display loading state in prayer table
     */
    showLoadingState() {
        this.elements.prayerRows.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                Loading prayer times...
            </div>
        `;
    }

    /**
     * CHECK JUMUAH STATUS
     * Check if Jumu'ah notice should be displayed
     */
    checkJumuahStatus() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        // Reset Jumu'ah status
        this.showJumuahNotice = false;
        this.jumuahTime = null;
        this.jumuahHighlightActive = false;

        // Check if today is Friday
        if (this.todayData?.is_friday && this.todayData?.jamaah_times?.Jumuah) {
            const jumuahTimeStr = this.todayData.jamaah_times.Jumuah;
            const [jumuahHours, jumuahMinutes] = jumuahTimeStr.split(':').map(Number);
            const jumuahTimeInMinutes = jumuahHours * 60 + jumuahMinutes;

            // Get Asr time for Friday
            const asrTimeStr = this.todayData.beginning_times?.Asr || this.getPrayerTime('Asr', 'beginning_times');
            const [asrHours, asrMinutes] = asrTimeStr.split(':').map(Number);
            const asrTimeInMinutes = asrHours * 60 + asrMinutes;

            // Check if current time is before Asr on Friday
            if (currentTime < asrTimeInMinutes) {
                this.showJumuahNotice = true;
                this.jumuahTime = jumuahTimeStr;

                // Check if it's time for Jumu'ah call (30 minutes before)
                if (currentTime >= jumuahTimeInMinutes - 30 && currentTime < jumuahTimeInMinutes) {
                    this.jumuahHighlightActive = true;
                }
            }
        }

        // Check if today is Thursday (day before Friday)
        if (currentDay === 4) {
            if (this.tomorrowData?.is_friday && this.tomorrowData?.jamaah_times?.Jumuah) {
                this.showJumuahNotice = true;
                this.jumuahTime = this.tomorrowData.jamaah_times.Jumuah;
                this.jumuahHighlightActive = true;
            }
        }
    }

    /**
     * UPDATE PRAYER STATUS
     * Determine current and next prayer indices
     */
    updatePrayerStatus() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        let currentPrayer = -1;

        this.prayerOrder.forEach((prayer, index) => {
            const jamaahTime = this.getPrayerTime(prayer, 'jamaah_times');
            if (jamaahTime && jamaahTime !== '--:--') {
                const [hours, minutes] = jamaahTime.split(':').map(Number);
                const prayerMinutes = hours * 60 + minutes;
                if (currentTime >= prayerMinutes) {
                    currentPrayer = index;
                }
            }
        });

        this.currentPrayerIndex = currentPrayer;
        this.nextPrayerIndex = currentPrayer + 1;

        if (this.nextPrayerIndex >= this.prayerOrder.length) {
            this.nextPrayerIndex = 0;
        }
    }

    /**
     * GET PRAYER TIME
     * Get prayer time for specific prayer and time type
     */
    getPrayerTime(prayerName, timeType = 'beginning_times') {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        let dataToUse = this.todayData;

        if (timeType === 'jamaah_times') {
            const jamaahKey = prayerName === 'Maghrib' ? 'Maghrib_Jamaah' : `${prayerName}_Jamaah`;
            const jamaahTime = this.todayData?.jamaah_times?.[jamaahKey];

            if (jamaahTime && jamaahTime !== '--:--') {
                const [hours, minutes] = jamaahTime.split(':').map(Number);
                const prayerMinutes = hours * 60 + minutes;

                if (currentTime >= prayerMinutes) {
                    dataToUse = this.tomorrowData;
                }
            }
        } else if (timeType === 'beginning_times') {
            const beginningTime = this.todayData?.beginning_times?.[prayerName];
            if (beginningTime && beginningTime !== '--:--') {
                const [hours, minutes] = beginningTime.split(':').map(Number);
                const prayerMinutes = hours * 60 + minutes;

                if (currentTime >= prayerMinutes) {
                    dataToUse = this.tomorrowData;
                }
            }
        }

        if (timeType === 'beginning_times') {
            return dataToUse?.beginning_times?.[prayerName] || '--:--';
        } else if (timeType === 'jamaah_times') {
            const jamaahKey = prayerName === 'Maghrib' ? 'Maghrib_Jamaah' : `${prayerName}_Jamaah`;
            return dataToUse?.jamaah_times?.[jamaahKey] || '--:--';
        }

        return '--:--';
    }

    /**
     * CALCULATE ADHAN TIME
     * Calculate Adhan time based on Jama'ah time
     */
    calculateAdhanTime(prayerName, jamaahTime, beginningTime) {
        if (!jamaahTime || jamaahTime === '--:--') {
            return '--:--';
        }

        if (prayerName === 'Maghrib') {
            return beginningTime || jamaahTime;
        }

        try {
            return this.subtractMinutes(jamaahTime, 15);
        } catch (error) {
            return jamaahTime;
        }
    }

    /**
     * SUBTRACT MINUTES
     * Subtract minutes from a time string
     */
    subtractMinutes(timeStr, minutes) {
        const [hours, mins] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, mins, 0, 0);
        date.setMinutes(date.getMinutes() - minutes);

        const newHours = String(date.getHours()).padStart(2, '0');
        const newMinutes = String(date.getMinutes()).padStart(2, '0');
        return `${newHours}:${newMinutes}`;
    }

    /**
     * RENDER PRAYER TIMES
     * Generate HTML for prayer table rows
     */
    renderPrayerTimes() {
        if (!this.elements.prayerRows) return;

        let html = '';
        this.prayerOrder.forEach((prayer, index) => {
            const beginningTime = this.getPrayerTime(prayer, 'beginning_times');
            const jamaahTime = this.getPrayerTime(prayer, 'jamaah_times');
            const adhanTime = this.calculateAdhanTime(prayer, jamaahTime, beginningTime);

            let statusClass = 'status-upcoming';
            let statusText = 'UPCOMING';
            let statusIcon = 'fas fa-clock';

            if (index === this.currentPrayerIndex) {
                statusClass = 'status-current';
                statusText = 'IN PROGRESS';
                statusIcon = 'fas fa-pray';
            } else if (index < this.currentPrayerIndex) {
                statusClass = 'status-passed';
                statusText = 'COMPLETED';
                statusIcon = 'fas fa-check';
            }

            const isNextPrayer = index === this.nextPrayerIndex;
            const rowClass = isNextPrayer ? 'prayer-row next-prayer' :
                           index === this.currentPrayerIndex ? 'prayer-row current-prayer' :
                           'prayer-row';

            html += `
                <div class="${rowClass}" data-prayer="${prayer}">
                    <div class="prayer-cell prayer-name">
                        <div class="prayer-icon">
                            <i class="${this.prayerIcons[prayer]}"></i>
                        </div>
                        ${this.prayerNames[prayer]}
                    </div>
                    <div class="prayer-cell prayer-beginning">${beginningTime}</div>
                    <div class="prayer-cell prayer-adhan">${adhanTime}</div>
                    <div class="prayer-cell prayer-jamaah">${jamaahTime}</div>
                    <div class="prayer-cell prayer-status ${statusClass}">
                        <i class="${statusIcon}"></i>
                        ${statusText}
                    </div>
                </div>
            `;
        });

        this.elements.prayerRows.innerHTML = html;

        // Update Jumu'ah highlight if needed
        this.updateJumuahHighlight();
    }

    /**
     * UPDATE JUMUAH HIGHLIGHT
     * Update next prayer highlight for Jumu'ah
     */
    updateJumuahHighlight() {
        const nextPrayerHighlight = this.elements.nextPrayerHighlight;

        if (this.showJumuahNotice) {
            // Change the highlight to show Jumu'ah
            this.elements.nextPrayerName.textContent = "JUMU'AH";
            this.elements.nextPrayerTime.textContent = this.jumuahTime || '--:--';

            // Calculate countdown to Jumu'ah
            if (this.jumuahTime && this.jumuahTime !== '--:--') {
                const countdownText = this.getPrayerCountdownToTime(this.jumuahTime);
                this.elements.nextPrayerCountdown.textContent = countdownText;
            } else {
                this.elements.nextPrayerCountdown.textContent = '--';
            }

            // Change highlight styling for Jumu'ah
            nextPrayerHighlight.style.display = 'flex';
            nextPrayerHighlight.style.background = 'linear-gradient(90deg, rgba(0, 150, 136, 0.3), rgba(0, 150, 136, 0.6))';
            nextPrayerHighlight.style.border = '3px solid rgba(0, 150, 136, 0.8)';

            // Change icon for Jumu'ah
            const highlightIcon = nextPrayerHighlight.querySelector('.highlight-icon i');
            if (highlightIcon) {
                highlightIcon.className = 'fas fa-users';
                highlightIcon.style.color = '#00ff9c';
            }

            // Change highlight label for Jumu'ah
            const highlightLabel = nextPrayerHighlight.querySelector('.highlight-label');
            if (highlightLabel) {
                highlightLabel.textContent = "FRIDAY PRAYER";
                highlightLabel.style.color = '#00ff9c';
            }

            // Add special animation for active Jumu'ah
            if (this.jumuahHighlightActive) {
                nextPrayerHighlight.style.animation = 'jumuah-pulse 2s infinite alternate';
            } else {
                nextPrayerHighlight.style.animation = 'none';
            }
        } else {
            // Reset to normal styling
            nextPrayerHighlight.style.background = 'linear-gradient(90deg, rgba(255, 152, 0, 0.3), rgba(255, 87, 34, 0.3))';
            nextPrayerHighlight.style.border = '3px solid rgba(255, 152, 0, 0.5)';
            nextPrayerHighlight.style.animation = 'none';

            const highlightIcon = nextPrayerHighlight.querySelector('.highlight-icon i');
            if (highlightIcon) {
                highlightIcon.className = 'fas fa-bell';
                highlightIcon.style.color = '#ff9800';
            }

            const highlightLabel = nextPrayerHighlight.querySelector('.highlight-label');
            if (highlightLabel) {
                highlightLabel.textContent = "NEXT PRAYER";
                highlightLabel.style.color = '#ffcc80';
            }
        }
    }

    /**
     * CHECK CALL FOR PRAYER
     * Check for both Adhan and Jama'ah popup times
     */
    checkCallForPrayer() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        // Check for Adhan and Jama'ah calls for each prayer
        this.prayerOrder.forEach(prayer => {
            try {
                const jamaahTime = this.getPrayerTime(prayer, 'jamaah_times');
                const beginningTime = this.getPrayerTime(prayer, 'beginning_times');

                if (jamaahTime === '--:--') return;

                const adhanTime = this.calculateAdhanTime(prayer, jamaahTime, beginningTime);

                if (adhanTime === '--:--') return;

                // Check Adhan time (15 minutes before Jama'ah, except Maghrib)
                const [adhanHours, adhanMinutes] = adhanTime.split(':').map(Number);
                let adhanDate = new Date(now);
                adhanDate.setHours(adhanHours, adhanMinutes, 0, 0);

                if (adhanDate < now) {
                    adhanDate.setDate(adhanDate.getDate() + 1);
                }

                const adhanDiffMs = adhanDate - now;
                const adhanDiffSeconds = Math.floor(adhanDiffMs / 1000);

                // Trigger Adhan popup 60 seconds before Adhan time
                if (adhanDiffSeconds <= 60 && adhanDiffSeconds > 0 && !this.adhanOverlayActive) {
                    this.startAdhanCall(prayer, adhanDiffSeconds);
                }

                // Check Jama'ah time
                const [jamaahHours, jamaahMinutes] = jamaahTime.split(':').map(Number);
                let jamaahDate = new Date(now);
                jamaahDate.setHours(jamaahHours, jamaahMinutes, 0, 0);

                if (jamaahDate < now) {
                    jamaahDate.setDate(jamaahDate.getDate() + 1);
                }

                const jamaahDiffMs = jamaahDate - now;
                const jamaahDiffSeconds = Math.floor(jamaahDiffMs / 1000);

                // Trigger Jama'ah popup 30 seconds before Jama'ah time
                if (jamaahDiffSeconds <= 30 && jamaahDiffSeconds > 0 && !this.jamaahOverlayActive) {
                    this.startJamaahCall(prayer, jamaahDiffSeconds);
                }

            } catch (error) {
                console.log('Error checking call for prayer:', error);
            }
        });

        // Check for Jumu'ah calls if applicable
        if (this.showJumuahNotice && this.jumuahTime && this.jumuahTime !== '--:--') {
            try {
                const [jumuahHours, jumuahMinutes] = this.jumuahTime.split(':').map(Number);
                let jumuahDate = new Date(now);
                jumuahDate.setHours(jumuahHours, jumuahMinutes, 0, 0);

                if (jumuahDate < now) {
                    jumuahDate.setDate(jumuahDate.getDate() + 1);
                }

                const diffMs = jumuahDate - now;
                const diffSeconds = Math.floor(diffMs / 1000);

                // Jumu'ah Adhan call 30 minutes before
                if (diffSeconds <= 1800 && diffSeconds > 0 && !this.adhanOverlayActive) {
                    this.startAdhanCall('Jumuah', Math.min(diffSeconds, 60));
                }

                // Jumu'ah Jama'ah call 30 seconds before
                if (diffSeconds <= 30 && diffSeconds > 0 && !this.jamaahOverlayActive) {
                    this.startJamaahCall('Jumuah', diffSeconds);
                }
            } catch (error) {
                console.log('Error checking Jumuah call:', error);
            }
        }
    }

    /**
     * START ADHAN CALL
     * Show Adhan popup with countdown
     */
    startAdhanCall(prayerName, initialSeconds) {
        if (this.adhanOverlayActive && this.currentAdhanPrayer === prayerName) return;

        this.adhanOverlayActive = true;
        this.currentAdhanPrayer = prayerName;
        this.adhanCountdown = initialSeconds;

        // Update overlay for Jumu'ah vs regular prayer
        if (prayerName === 'Jumuah') {
            this.elements.adhanPrayerName.textContent = "JUMU'AH PRAYER";
        } else {
            this.elements.adhanPrayerName.textContent = `${this.prayerNames[prayerName]} PRAYER`;
        }

        this.elements.adhanCountdown.textContent = `00:${String(this.adhanCountdown).padStart(2, '0')}`;
        this.elements.adhanOverlay.style.display = 'block';

        // Clear any existing timer
        if (this.adhanTimer) {
            clearInterval(this.adhanTimer);
        }

        // Start countdown timer
        this.adhanTimer = setInterval(() => {
            this.adhanCountdown--;
            this.elements.adhanCountdown.textContent = `00:${String(this.adhanCountdown).padStart(2, '0')}`;

            if (this.adhanCountdown <= 0) {
                clearInterval(this.adhanTimer);
                this.endAdhanCall();
            }
        }, 1000);
    }

    /**
     * END ADHAN CALL
     * Hide Adhan popup
     */
    endAdhanCall() {
        setTimeout(() => {
            this.adhanOverlayActive = false;
            this.currentAdhanPrayer = null;
            this.elements.adhanOverlay.style.display = 'none';

            if (this.adhanTimer) {
                clearInterval(this.adhanTimer);
                this.adhanTimer = null;
            }
        }, 1000);
    }

    /**
     * START JAMA'AH CALL
     * Show Jama'ah popup with countdown
     */
    startJamaahCall(prayerName, initialSeconds) {
        if (this.jamaahOverlayActive && this.currentJamaahPrayer === prayerName) return;

        this.jamaahOverlayActive = true;
        this.currentJamaahPrayer = prayerName;
        this.jamaahCountdown = initialSeconds;

        // Update overlay for Jumu'ah vs regular prayer
        if (prayerName === 'Jumuah') {
            this.elements.jamaahPrayerName.textContent = "JUMU'AH PRAYER";
        } else {
            this.elements.jamaahPrayerName.textContent = `${this.prayerNames[prayerName]} PRAYER`;
        }

        this.elements.jamaahCountdown.textContent = `00:${String(this.jamaahCountdown).padStart(2, '0')}`;
        this.elements.jamaahOverlay.style.display = 'block';

        // Clear any existing timer
        if (this.jamaahTimer) {
            clearInterval(this.jamaahTimer);
        }

        // Start countdown timer
        this.jamaahTimer = setInterval(() => {
            this.jamaahCountdown--;
            this.elements.jamaahCountdown.textContent = `00:${String(this.jamaahCountdown).padStart(2, '0')}`;

            if (this.jamaahCountdown <= 0) {
                clearInterval(this.jamaahTimer);
                this.endJamaahCall();
            }
        }, 1000);
    }

    /**
     * END JAMA'AH CALL
     * Hide Jama'ah popup
     */
    endJamaahCall() {
        setTimeout(() => {
            this.jamaahOverlayActive = false;
            this.currentJamaahPrayer = null;
            this.elements.jamaahOverlay.style.display = 'none';

            if (this.jamaahTimer) {
                clearInterval(this.jamaahTimer);
                this.jamaahTimer = null;
            }
        }, 1000);
    }

    /**
     * UPDATE NEXT PRAYER
     * Update next prayer highlight section
     */
    updateNextPrayer() {
        if (!this.showJumuahNotice) {
            if (this.nextPrayerIndex >= 0 && this.nextPrayerIndex < this.prayerOrder.length) {
                const nextPrayerName = this.prayerOrder[this.nextPrayerIndex];
                const jamaahTime = this.getPrayerTime(nextPrayerName, 'jamaah_times');

                this.elements.nextPrayerName.textContent = this.prayerNames[nextPrayerName];
                this.elements.nextPrayerTime.textContent = jamaahTime;

                const countdownText = this.getPrayerCountdownToTime(jamaahTime);
                this.elements.nextPrayerCountdown.textContent = countdownText;

                this.elements.nextPrayerHighlight.style.display = 'flex';
            } else {
                this.elements.nextPrayerHighlight.style.display = 'none';
            }
        }
    }

    /**
     * GET PRAYER COUNTDOWN TO TIME
     * Calculate countdown text to target time
     */
    getPrayerCountdownToTime(targetTime) {
        if (targetTime === '--:--') return '--';

        const now = new Date();
        const [hours, minutes] = targetTime.split(':').map(Number);
        let targetDate = new Date(now);
        targetDate.setHours(hours, minutes, 0, 0);

        if (targetDate < now) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        const diffMs = targetDate - now;
        if (diffMs > 0 && diffMs <= 86400000) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const diffSeconds = Math.floor((diffMs % 60000) / 1000);

            if (diffHours > 0) {
                return `in ${diffHours}h ${diffMinutes}m`;
            } else if (diffMinutes > 0) {
                return `in ${diffMinutes}m ${diffSeconds}s`;
            } else {
                return `in ${diffSeconds}s`;
            }
        }
        return '--';
    }

    /**
     * START SLIDESHOW CYCLE
     * Manage slideshow display cycle
     */
    startSlideshowCycle() {
        if (this.slideshowImages.length === 0) {
            this.updateSlideshowStatus('Slideshow: No images', 'warning');
            return;
        }

        if (this.slideshowCycleInterval) {
            clearInterval(this.slideshowCycleInterval);
        }

        // Show slideshow every 2 minutes
        this.slideshowCycleInterval = setInterval(() => {
            if (this.isSlideshowActive) {
                this.hideSlideshow();
            } else {
                this.showSlideshow();
            }
        }, 120000);

        // Show first image after 15 seconds
        setTimeout(() => {
            this.showSlideshow();
        }, 15000);
    }

    /**
     * SHOW SLIDESHOW
     * Display slideshow popup
     */
    showSlideshow() {
        if (this.slideshowImages.length === 0 || this.isSlideshowActive) return;

        this.isSlideshowActive = true;
        this.currentImageIndex = (this.currentImageIndex + 1) % this.slideshowImages.length;
        const image = this.slideshowImages[this.currentImageIndex];

        const img = new Image();
        img.onload = () => {
            this.elements.slideshowImage.src = image.src;
            this.elements.slideshowImage.alt = image.caption;
            this.elements.slideshowCaption.textContent = image.caption;
            this.elements.imageCounter.textContent = `${this.currentImageIndex + 1}/${this.slideshowImages.length}`;

            this.elements.slideshowPopup.style.display = 'flex';

            // Reset and start timer bar animation
            this.elements.slideshowTimerBar.style.transition = 'none';
            this.elements.slideshowTimerBar.style.width = '100%';

            // Force reflow
            void this.elements.slideshowTimerBar.offsetWidth;

            this.elements.slideshowTimerBar.style.transition = 'width 30s linear';
            this.elements.slideshowTimerBar.style.width = '0%';

            // Auto-hide after 30 seconds
            if (this.slideshowHideTimeout) {
                clearTimeout(this.slideshowHideTimeout);
            }
            this.slideshowHideTimeout = setTimeout(() => {
                this.hideSlideshow();
            }, 30000);
        };

        img.onerror = () => {
            console.log('Failed to load image:', image.src);
            this.hideSlideshow();
            setTimeout(() => {
                this.showSlideshow();
            }, 2000);
        };

        img.src = image.src;
    }

    /**
     * HIDE SLIDESHOW
     * Hide slideshow popup
     */
    hideSlideshow() {
        if (!this.isSlideshowActive) return;

        this.isSlideshowActive = false;
        this.elements.slideshowPopup.style.display = 'none';

        if (this.slideshowHideTimeout) {
            clearTimeout(this.slideshowHideTimeout);
            this.slideshowHideTimeout = null;
        }

        this.elements.slideshowTimerBar.style.transition = 'none';
        this.elements.slideshowTimerBar.style.width = '100%';
    }

    /**
     * SETUP FOOTER AUTO HIDE
     * Auto-hide footer after inactivity
     */
    setupFooterAutoHide() {
        this.footerHideTimeout = setTimeout(() => {
            this.toggleFooter(false);
        }, 10000);

        document.addEventListener('mousemove', () => {
            if (this.footerHidden) {
                this.toggleFooter(true);
                clearTimeout(this.footerHideTimeout);
                this.footerHideTimeout = setTimeout(() => {
                    this.toggleFooter(false);
                }, 5000);
            }
        });
    }

    /**
     * TOGGLE FOOTER
     * Show/hide footer section
     */
    toggleFooter(show = null) {
        if (show === null) {
            this.footerHidden = !this.footerHidden;
        } else {
            this.footerHidden = !show;
        }

        if (this.footerHidden) {
            this.elements.footer.classList.add('hidden');
            this.elements.footerToggleBtn.innerHTML = '<i class="fas fa-eye"></i> Show Footer';
        } else {
            this.elements.footer.classList.remove('hidden');
            this.elements.footerToggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Footer';
        }

        localStorage.setItem('footerHidden', this.footerHidden);
    }

    /**
     * SETUP EVENT LISTENERS
     * Setup all event listeners
     */
    setupEventListeners() {
        // Month navigation
        this.elements.prevMonthBtn?.addEventListener('click', () => this.changeMonth(-1));
        this.elements.nextMonthBtn?.addEventListener('click', () => this.changeMonth(1));

        // Close slideshow on click
        this.elements.slideshowPopup?.addEventListener('click', (e) => {
            if (e.target === this.elements.slideshowPopup ||
                e.target.classList.contains('popup-overlay')) {
                this.hideSlideshow();
            }
        });

        // Close overlays on click
        this.elements.adhanOverlay?.addEventListener('click', (e) => {
            if (e.target === this.elements.adhanOverlay) {
                this.endAdhanCall();
            }
        });

        this.elements.jamaahOverlay?.addEventListener('click', (e) => {
            if (e.target === this.elements.jamaahOverlay) {
                this.endJamaahCall();
            }
        });

        // Footer toggle button
        this.elements.footerToggleBtn?.addEventListener('click', () => {
            this.toggleFooter();
        });

        // Load saved footer state
        const savedFooterState = localStorage.getItem('footerHidden');
        if (savedFooterState === 'true') {
            this.toggleFooter(false);
        }

        // Fullscreen change listener
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                setTimeout(() => this.requestFullscreen(), 1000);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.key.toLowerCase()) {
                case 's':
                    this.toggleSlideshow();
                    break;
                case 'a':
                    this.testAdhanCall();
                    break;
                case 'j':
                    this.testJamaahCall();
                    break;
                case 'escape':
                    this.hideSlideshow();
                    this.endAdhanCall();
                    this.endJamaahCall();
                    break;
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        location.reload();
                    }
                    break;
                case 'f':
                    this.requestFullscreen();
                    break;
                case 'h':
                    this.toggleFooter();
                    break;
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateDisplay();
        });

        // Handle page visibility
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadPrayerData();
                this.updateDateTime();
            }
        });
    }

    /**
     * TOGGLE SLIDESHOW
     * Toggle slideshow display
     */
    toggleSlideshow() {
        if (this.isSlideshowActive) {
            this.hideSlideshow();
        } else {
            this.showSlideshow();
        }
    }

    /**
     * TEST ADHAN CALL
     * Test Adhan popup (for development)
     */
    testAdhanCall() {
        this.startAdhanCall('Fajr', 20);
    }

    /**
     * TEST JAMA'AH CALL
     * Test Jama'ah popup (for development)
     */
    testJamaahCall() {
        this.startJamaahCall('Fajr', 30);
    }

    /**
     * CHANGE MONTH
     * Navigate between months
     */
    async changeMonth(delta) {
        this.currentMonth += delta;

        if (this.currentMonth > 12) {
            this.currentMonth = 1;
            this.currentYear++;
        } else if (this.currentMonth < 1) {
            this.currentMonth = 12;
            this.currentYear--;
        }

        this.currentDate = new Date(this.currentYear, this.currentMonth - 1, 1);

        await this.loadPrayerData();
        this.updateDisplay();
        this.updateDateTime();
    }

    /**
     * SETUP TIMERS
     * Setup all interval timers
     */
    setupTimers() {
        // Update time every second
        setInterval(() => {
            this.updateDateTime();
        }, 1000);

        // Update display every 30 seconds
        setInterval(() => {
            this.updateDisplay();
        }, 30000);

        // Check for prayer calls every second
        setInterval(() => {
            this.checkCallForPrayer();
        }, 1000);

        // Reload data every 5 minutes
        setInterval(async () => {
            await this.loadPrayerData();
            this.updateDisplay();
        }, 300000);

        // Refresh images every 30 minutes
        setInterval(async () => {
            await this.loadSlideshowImages();
        }, 30 * 60 * 1000);

        // Auto-refresh entire page every 24 hours
        setInterval(() => {
            location.reload();
        }, 24 * 60 * 60 * 1000);
    }

    /**
     * FORMAT DATE
     * Format date to YYYY-MM-DD string
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.dashboard = new PrayerTimesDashboard();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        document.body.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: linear-gradient(135deg, #0c2461 0%, #1e3799 100%);
                color: white;
                font-family: 'Poppins', sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div>
                    <h1 style="font-size: 3rem; margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle"></i> Dashboard Error
                    </h1>
                    <p style="font-size: 1.5rem; margin-bottom: 30px;">
                        Failed to initialize the dashboard. Please check the console for details.
                    </p>
                    <button onclick="location.reload()" style="
                        background: #74c0fc;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        font-size: 1.2rem;
                        border-radius: 10px;
                        cursor: pointer;
                        margin-top: 20px;
                    ">
                        <i class="fas fa-redo"></i> Reload Dashboard
                    </button>
                </div>
            </div>
        `;
    }
});
