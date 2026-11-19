/**
 * ============================================================================
 * DINO WORLD – JELAJAHI ZAMAN DINOSAURUS
 * Script JavaScript Utama (script.js)
 * 
 * Modul:
 * 1. SoundManager (Memutar File Audio Asli MP3 Dinosaurus + Fallback Synth)
 * 2. Navigasi & Mobile Menu & Scrollspy
 * 3. Partikel Bara Api Prasejarah (Ember Particles)
 * 4. Filter & Pencarian Kartu Dinosaurus
 * 5. Dialog Interaktif (Prompt, Alert, Confirm)
 * 6. Mini Game A: Tebak Nama Dinosaurus (Audio Hint, Alert & Skor)
 * 7. Mini Game B: Kumpulkan Telur Dinosaurus (HTML5 Canvas 2D)
 * 8. Mini Game C: Kuis Pengetahuan Dinosaurus (10 Soal & Kategori Skor)
 * 9. Formulir Pendaftaran Pengunjung & Validasi Input
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ==========================================================================
     1. SISTEM AUDIO DINOSAURUS (REKAMAN SUARA ASLI MP3 & FALLBACK SYNTH)
     ========================================================================== */
  class SoundManager {
    constructor() {
      this.enabled = true;
      this.ctx = null;
      this.currentAudio = null;
      this.activeButton = null;

      // Pemetaan file audio asli dinosaurus (format MP3 lokal)
      this.audioFiles = {
        trex: 'audio/trex.mp3',
        tyrannosaurus: 'audio/trex.mp3',
        triceratops: 'audio/triceratops.mp3',
        velociraptor: 'audio/velociraptor.mp3',
        raptor: 'audio/velociraptor.mp3',
        brachiosaurus: 'audio/brachiosaurus.mp3',
        brachio: 'audio/brachiosaurus.mp3',
        stegosaurus: 'audio/stegosaurus.mp3',
        stego: 'audio/stegosaurus.mp3',
        spinosaurus: 'audio/spinosaurus.mp3',
        spino: 'audio/spinosaurus.mp3'
      };

      // Cache audio player untuk performa instan tanpa jeda
      this.audioCache = {};
      this.preloadAudio();
    }

    preloadAudio() {
      // Preload seluruh file audio agar siap diputar seketika
      Object.keys(this.audioFiles).forEach(key => {
        const path = this.audioFiles[key];
        if (!this.audioCache[path]) {
          const a = new Audio();
          a.src = path;
          a.preload = 'auto';
          this.audioCache[path] = a;
        }
      });
    }

    initContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // Memutar Suara Asli Dinosaurus dari File Rekaman MP3
    playRoar(type = 'trex', buttonElement = null) {
      if (!this.enabled) return;

      const normType = type.toLowerCase().trim();
      const filePath = this.audioFiles[normType] || this.audioFiles['trex'];

      // Jika audio yang sama sedang berputar dan tombol yang sama diklik -> jeda/hentikan
      if (this.currentAudio && this.activeButton === buttonElement && !this.currentAudio.paused) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.resetButtonState();
        return;
      }

      // Hentikan audio dinosaurus sebelumnya jika masih berjalan
      this.stopAll();

      let audio = this.audioCache[filePath];
      if (!audio) {
        audio = new Audio(filePath);
        audio.preload = 'auto';
        this.audioCache[filePath] = audio;
      }

      this.currentAudio = audio;
      this.activeButton = buttonElement;

      // Ubah tampilan tombol saat audio mulai memutar
      if (buttonElement) {
        if (!buttonElement.getAttribute('data-original-text')) {
          buttonElement.setAttribute('data-original-text', buttonElement.innerHTML);
        }
        buttonElement.innerHTML = '🔊 Memutar Suara... ⏸️';
        buttonElement.classList.add('playing');
      }

      audio.currentTime = 0;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Audio berhasil diputar
        }).catch(err => {
          console.warn('Gagal memutar audio MP3 langsung, beralih ke fallback synthesizer:', err);
          this.playRoarSynth(normType);
          this.resetButtonState();
        });
      }

      // Ketika audio selesai, pulihkan tampilan tombol
      audio.onended = () => {
        this.resetButtonState();
      };

      audio.onerror = () => {
        console.warn('File audio tidak dapat dimuat, beralih ke fallback synth.');
        this.playRoarSynth(normType);
        this.resetButtonState();
      };
    }

    // Menghentikan semua audio yang sedang berjalan
    stopAll() {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      }
      this.resetButtonState();
    }

    resetButtonState() {
      if (this.activeButton) {
        const origText = this.activeButton.getAttribute('data-original-text');
        if (origText) {
          this.activeButton.innerHTML = origText;
        } else {
          this.activeButton.innerHTML = '🔊 Dengar Suara';
        }
        this.activeButton.classList.remove('playing');
        this.activeButton = null;
      }
    }

    // Fallback: Sintesis Web Audio API jika file audio dicegah oleh browser
    playRoarSynth(type = 'trex') {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.type = 'sawtooth';

      let startFreq = 160;
      let endFreq = 45;
      let duration = 1.2;

      if (type.includes('raptor')) {
        startFreq = 450;
        endFreq = 180;
        duration = 0.6;
      } else if (type.includes('brachio')) {
        startFreq = 110;
        endFreq = 40;
        duration = 1.8;
      }

      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }

    // Suara Ambil Telur (Mini Game)
    playCatch(isGolden = false) {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const freq = isGolden ? 880 : 587.33;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    }

    // Suara Tabrakan Batu Api
    playHit() {
      if (!this.enabled) return;
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    }

    toggle() {
      this.enabled = !this.enabled;
      if (!this.enabled) {
        this.stopAll();
      }
      return this.enabled;
    }
  }

  const soundMgr = new SoundManager();

  // Tombol Toggle Audio di Navbar
  const btnAudioToggle = document.getElementById('btnAudioToggle');
  if (btnAudioToggle) {
    btnAudioToggle.addEventListener('click', () => {
      const isSoundOn = soundMgr.toggle();
      btnAudioToggle.innerHTML = isSoundOn 
        ? '<span class="icon-sound">🔊</span> Efek Suara' 
        : '<span class="icon-sound">🔇</span> Suara Mati';
      if (isSoundOn) {
        soundMgr.playCatch(false);
      }
    });
  }

  // Event listener tombol raungan di setiap kartu dinosaurus
  document.querySelectorAll('.btn-roar').forEach(btn => {
    btn.addEventListener('click', () => {
      const dinoType = btn.getAttribute('data-dino') || 'trex';
      soundMgr.playRoar(dinoType, btn);
    });
  });

  // Klik ilustrasi T-Rex di Hero section untuk mendengar suara aslinya
  const heroDinoSvg = document.querySelector('.hero-dino-svg');
  if (heroDinoSvg) {
    heroDinoSvg.style.cursor = 'pointer';
    heroDinoSvg.setAttribute('title', 'Klik untuk mendengar raungan T-Rex!');
    heroDinoSvg.addEventListener('click', () => {
      soundMgr.playRoar('trex');
      heroDinoSvg.classList.add('btn-pulse');
      setTimeout(() => heroDinoSvg.classList.remove('btn-pulse'), 1200);
    });
  }


  /* ==========================================================================
     2. NAVIGASI, MOBILE MENU, SCROLLSPY & SMOOTH SCROLL
     ========================================================================== */
  const header = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    const scrollPos = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  const btnBackToTop = document.getElementById('btnBackToTop');
  if (btnBackToTop) {
    btnBackToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ==========================================================================
     3. PARTIKEL BARA API & SPORA PRASEJARAH
     ========================================================================== */
  const emberContainer = document.getElementById('emberParticles');
  if (emberContainer) {
    const particleCount = 25;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('ember-particle');
      
      const left = Math.random() * 100;
      const duration = 4 + Math.random() * 6;
      const delay = Math.random() * 5;
      const size = 2 + Math.random() * 4;

      particle.style.left = `${left}%`;
      particle.style.animationDuration = `${duration}s`;
      particle.style.animationDelay = `${delay}s`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      emberContainer.appendChild(particle);
    }
  }


  /* ==========================================================================
     4. FILTER & PENCARIAN KARTU DINOSAURUS
     ========================================================================== */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const dinoCards = document.querySelectorAll('.dino-card');
  const searchInput = document.getElementById('dinoSearchInput');

  function applyDinoFilter() {
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const filterValue = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    dinoCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const period = card.getAttribute('data-period');
      const dinoName = card.getAttribute('data-name');

      const matchesCategory = (filterValue === 'all') || 
                              (filterValue === category) || 
                              (filterValue === period);
      const matchesSearch = !query || dinoName.includes(query);

      if (matchesCategory && matchesSearch) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyDinoFilter();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyDinoFilter);
  }


  /* ==========================================================================
     5. FITUR DIALOG JAVASCRIPT: PROMPT, ALERT, CONFIRM
     ========================================================================== */
  function executeInteractiveDialog() {
    // 1. JavaScript PROMPT untuk meminta nama pengunjung
    const visitorName = prompt('🌋 Selamat datang di DINO WORLD!\nSiapa nama penjelajah prasejarah Anda?', 'Penjelajah Pemberani');

    if (visitorName === null || visitorName.trim() === '') {
      alert('Salam penjelajah misterius! Anda tetap dipersilakan menjelajahi hutan purba kami.');
      return;
    }

    const cleanName = visitorName.trim();

    // 2. JavaScript ALERT untuk memberikan sambutan hangat
    alert(`🎉 Halo, ${cleanName}!\nSelamat datang di DINO WORLD. Bersiaplah melintasi waktu menuju 230 juta tahun lalu dan temui para raksasa prasejarah!`);

    // 3. JavaScript CONFIRM untuk memastikan pengguna ingin memulai petualangan/permainan
    const isReady = confirm(`Apakah Anda sudah siap menjelajahi zona Mini Game dan menguji ketangkasan sekarang, ${cleanName}?`);

    if (isReady) {
      alert(`Bagus sekali, ${cleanName}! Ayo menuju ke Arena Mini Game!`);
      const gameSection = document.getElementById('mini-game');
      if (gameSection) {
        gameSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      alert(`Tidak masalah, ${cleanName}. Silakan nikmati informasi kronologi sejarah dan ensiklopedia dinosaurus terlebih dahulu!`);
      const dinoSection = document.getElementById('jenis-dino');
      if (dinoSection) {
        dinoSection.scrollIntoView({ behavior: 'smooth' });
      }
    }

    const formNameInput = document.getElementById('visitorName');
    if (formNameInput && !formNameInput.value) {
      formNameInput.value = cleanName;
    }
  }

  const btnTriggerDialog = document.getElementById('btnTriggerDialog');
  if (btnTriggerDialog) {
    btnTriggerDialog.addEventListener('click', executeInteractiveDialog);
  }

  const btnDialogInteraktifHero = document.getElementById('btnDialogInteraktifHero');
  if (btnDialogInteraktifHero) {
    btnDialogInteraktifHero.addEventListener('click', executeInteractiveDialog);
  }

  const btnMulaiPetualangan = document.getElementById('btnMulaiPetualangan');
  if (btnMulaiPetualangan) {
    btnMulaiPetualangan.addEventListener('click', () => {
      soundMgr.playRoar('trex');
      const dinoSection = document.getElementById('sejarah');
      if (dinoSection) {
        dinoSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }


  /* ==========================================================================
     6. MINI GAME A: TEBAK NAMA DINOSAURUS (DENGAN AUDIO PETUNJUK, ALERT & SKOR)
     ========================================================================== */
  const tebakQuestions = [
    {
      name: 'Tyrannosaurus Rex (T-Rex)',
      audioKey: 'trex',
      hint: 'Predator karnivora raksasa dengan tangan pendek dan gigitan terkuat di periode Kapur.',
      options: ['Tyrannosaurus Rex', 'Brachiosaurus', 'Stegosaurus', 'Triceratops'],
      correctIndex: 0,
      fact: 'T-Rex memiliki rahang dengan kekuatan gigitan hingga 57.000 Newton!',
      svg: `<svg viewBox="0 0 200 160" width="180" height="140">
        <ellipse cx="100" cy="80" rx="60" ry="40" fill="#2d5e23"/>
        <path d="M120,50 Q160,30 180,60 Q150,90 120,70 Z" fill="#4caf50"/>
        <circle cx="155" cy="50" r="5" fill="#ffb703"/>
        <polygon points="140,70 145,80 150,70" fill="#fff"/>
        <polygon points="152,70 157,80 162,70" fill="#fff"/>
        <line x1="70" y1="100" x2="60" y2="140" stroke="#1b3c16" stroke-width="8"/>
        <line x1="110" y1="100" x2="120" y2="140" stroke="#2d5e23" stroke-width="8"/>
      </svg>`
    },
    {
      name: 'Triceratops',
      audioKey: 'triceratops',
      hint: 'Herbivora dengan 3 tanduk tajam di kepala dan pelindung leher tulang (frill).',
      options: ['Velociraptor', 'Triceratops', 'Spinosaurus', 'Allosaurus'],
      correctIndex: 1,
      fact: 'Triceratops menggunakan tiga tanduknya untuk mempertahankan diri dari predator seperti T-Rex.',
      svg: `<svg viewBox="0 0 200 160" width="180" height="140">
        <ellipse cx="90" cy="85" rx="50" ry="32" fill="#795548"/>
        <circle cx="135" cy="80" r="24" fill="#5d4037"/>
        <line x1="130" y1="65" x2="160" y2="40" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
        <line x1="150" y1="85" x2="170" y2="80" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        <circle cx="135" cy="74" r="3" fill="#212121"/>
        <rect x="65" y="110" width="14" height="30" rx="4" fill="#4e342e"/>
        <rect x="110" y="110" width="14" height="30" rx="4" fill="#4e342e"/>
      </svg>`
    },
    {
      name: 'Brachiosaurus',
      audioKey: 'brachiosaurus',
      hint: 'Raksasa herbivora leher sangat panjang yang kaki depannya lebih tinggi dari kaki belakang.',
      options: ['Stegosaurus', 'Velociraptor', 'Brachiosaurus', 'Pterodactyl'],
      correctIndex: 2,
      fact: 'Brachiosaurus dapat menjangkau daun di pohon setinggi 13 meter tanpa mengangkat kakinya!',
      svg: `<svg viewBox="0 0 200 160" width="180" height="140">
        <ellipse cx="90" cy="95" rx="40" ry="25" fill="#558b2f"/>
        <path d="M110,95 Q140,50 145,25 Q155,23 158,35 Q145,65 125,100 Z" fill="#689f38"/>
        <ellipse cx="150" cy="24" rx="9" ry="6" fill="#7cb342"/>
        <rect x="75" y="115" width="12" height="30" rx="4" fill="#33691e"/>
        <rect x="110" y="105" width="14" height="40" rx="4" fill="#33691e"/>
      </svg>`
    },
    {
      name: 'Stegosaurus',
      audioKey: 'stegosaurus',
      hint: 'Dinosaurus berlempeng segitiga ganda di punggung dan 4 duri tajam di ujung ekornya.',
      options: ['Stegosaurus', 'Ankylosaurus', 'Parasaurolophus', 'Spinosaurus'],
      correctIndex: 0,
      fact: 'Meskipun tubuhnya sebesar bus, otak Stegosaurus hanya berukuran sebesar kenari.',
      svg: `<svg viewBox="0 0 200 160" width="180" height="140">
        <ellipse cx="100" cy="95" rx="48" ry="26" fill="#00695c"/>
        <polygon points="70,70 80,48 90,70" fill="#ffa000"/>
        <polygon points="92,68 105,42 118,68" fill="#ffb300"/>
        <polygon points="120,70 132,50 142,70" fill="#ffa000"/>
        <ellipse cx="155" cy="110" rx="12" ry="8" fill="#004d40"/>
        <line x1="45" y1="95" x2="20" y2="90" stroke="#004d40" stroke-width="6"/>
        <line x1="25" y1="90" x2="15" y2="80" stroke="#fff" stroke-width="3"/>
      </svg>`
    },
    {
      name: 'Velociraptor',
      audioKey: 'velociraptor',
      hint: 'Pemburu bipedal kecil yang sangat gesit, cerdas, dan memiliki cakar melengkung seperti sabit.',
      options: ['Triceratops', 'Diplodocus', 'Velociraptor', 'Carnotaurus'],
      correctIndex: 2,
      fact: 'Velociraptor sebenarnya berukuran setinggi anjing kalkun besar dan dipenuhi bulu!',
      svg: `<svg viewBox="0 0 200 160" width="180" height="140">
        <path d="M30,95 Q70,90 95,85" stroke="#e65100" stroke-width="6" fill="none"/>
        <ellipse cx="105" cy="80" rx="28" ry="16" fill="#f57c00"/>
        <path d="M125,75 Q145,55 165,55 L175,65 L145,85 Z" fill="#ff9800"/>
        <path d="M100,95 L110,130 L125,135" stroke="#e65100" stroke-width="4" fill="none"/>
        <path d="M115,130 Q122,118 112,122" stroke="#fff" stroke-width="3" fill="none"/>
      </svg>`
    },
    {
      name: 'Spinosaurus',
      audioKey: 'spinosaurus',
      hint: 'Predator semi-akuatik terbesar dengan moncong panjang seperti buaya dan layar di punggungnya.',
      options: ['Spinosaurus', 'T-Rex', 'Allosaurus', 'Mosasaurus'],
      correctIndex: 0,
      fact: 'Spinosaurus merupakan dinosaurus perenang ulung dan pemburu ikan raksasa di perairan purba.',
      svg: `<svg viewBox="0 0 200 160" width="180" height="140">
        <path d="M70,80 Q100,25 130,75 Z" fill="#d84315"/>
        <ellipse cx="100" cy="85" rx="42" ry="22" fill="#bf360c"/>
        <path d="M125,80 L170,75 L165,88 L125,92 Z" fill="#e64a19"/>
        <circle cx="140" cy="78" r="3" fill="#ffe082"/>
        <rect x="85" y="105" width="12" height="30" rx="4" fill="#870000"/>
      </svg>`
    }
  ];

  let currentTebakIndex = 0;
  let tebakScore = 0;

  const tebakVisualContainer = document.getElementById('tebakVisualContainer');
  const tebakHint = document.getElementById('tebakHint');
  const tebakOptionsGrid = document.getElementById('tebakOptionsGrid');
  const tebakScoreDisplay = document.getElementById('tebakScore');
  const btnNextTebak = document.getElementById('btnNextTebak');
  const btnResetTebak = document.getElementById('btnResetTebak');
  const btnTebakAudioHint = document.getElementById('btnTebakAudioHint');

  function renderTebakQuestion() {
    soundMgr.stopAll();

    const q = tebakQuestions[currentTebakIndex];
    if (tebakVisualContainer) {
      tebakVisualContainer.innerHTML = q.svg;
    }
    if (tebakHint) {
      tebakHint.textContent = `Petunjuk: "${q.hint}"`;
    }

    if (btnTebakAudioHint) {
      btnTebakAudioHint.innerHTML = '🔊 Putar Suara Misterius';
      btnTebakAudioHint.onclick = () => {
        soundMgr.playRoar(q.audioKey, btnTebakAudioHint);
      };
    }

    if (tebakOptionsGrid) {
      tebakOptionsGrid.innerHTML = '';
      q.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.classList.add('tebak-opt-btn');
        btn.textContent = `${['A', 'B', 'C', 'D'][idx]}. ${optText}`;
        btn.addEventListener('click', () => checkTebakAnswer(idx));
        tebakOptionsGrid.appendChild(btn);
      });
    }
  }

  function checkTebakAnswer(selectedIndex) {
    const q = tebakQuestions[currentTebakIndex];
    if (selectedIndex === q.correctIndex) {
      tebakScore += 20;
      if (tebakScoreDisplay) tebakScoreDisplay.textContent = tebakScore;
      
      // Putar suara asli dinosaurus saat jawaban benar!
      soundMgr.playRoar(q.audioKey);

      // PENGGUNAAN JAVASCRIPT ALERT SESUAI SPESIFIKASI TUGAS
      setTimeout(() => {
        alert(`🎉 BENAR SEKALI!\n\nNama Dinosaurus: ${q.name}\nSkor Anda: +20 (Total: ${tebakScore})\n\n💡 Fakta Menarik:\n${q.fact}`);
        currentTebakIndex = (currentTebakIndex + 1) % tebakQuestions.length;
        renderTebakQuestion();
      }, 350);
    } else {
      soundMgr.playHit();
      // PENGGUNAAN JAVASCRIPT ALERT
      alert(`❌ JAWABAN KURANG TEPAT!\n\nJawaban yang benar adalah: ${q.name}\n\n💡 Fakta Menarik:\n${q.fact}\n\nTetap semangat dan coba soal berikutnya!`);
      currentTebakIndex = (currentTebakIndex + 1) % tebakQuestions.length;
      renderTebakQuestion();
    }
  }

  if (btnNextTebak) {
    btnNextTebak.addEventListener('click', () => {
      soundMgr.stopAll();
      currentTebakIndex = (currentTebakIndex + 1) % tebakQuestions.length;
      renderTebakQuestion();
    });
  }

  if (btnResetTebak) {
    btnResetTebak.addEventListener('click', () => {
      const willReset = confirm('Apakah Anda yakin ingin mengulang permainan Tebak Dinosaurus dari awal?');
      if (willReset) {
        soundMgr.stopAll();
        tebakScore = 0;
        currentTebakIndex = 0;
        if (tebakScoreDisplay) tebakScoreDisplay.textContent = '0';
        renderTebakQuestion();
        alert('Skor telah direset menjadi 0. Selamat bermain kembali!');
      }
    });
  }

  renderTebakQuestion();


  /* ==========================================================================
     7. MINI GAME B: PETUALANGAN KUMPULKAN TELUR DINOSAURUS (CANVAS 2D)
     ========================================================================== */
  const canvas = document.getElementById('dinoEggCanvas');
  const overlay = document.getElementById('canvasOverlay');
  const btnStartEggGame = document.getElementById('btnStartEggGame');
  const timerDisplay = document.getElementById('eggTimerDisplay');
  const scoreDisplay = document.getElementById('eggScoreDisplay');
  const highScoreDisplay = document.getElementById('eggHighScoreDisplay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayDesc = document.getElementById('overlayDesc');

  const btnTouchLeft = document.getElementById('btnTouchLeft');
  const btnTouchRight = document.getElementById('btnTouchRight');

  let ctx = null;
  if (canvas) {
    ctx = canvas.getContext('2d');
  }

  const GAME_DURATION = 30;
  let eggScore = 0;
  let eggHighScore = 0;
  let eggTimeLeft = GAME_DURATION;
  let isEggGameRunning = false;
  let eggTimerInterval = null;
  let eggAnimationId = null;

  const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    KeyA: false,
    KeyD: false
  };

  const playerDino = {
    x: 310,
    y: 340,
    width: 70,
    height: 55,
    speed: 7,
    facing: 'right'
  };

  let fallingItems = [];

  function spawnFallingItem() {
    if (!isEggGameRunning || !canvas) return;

    const rand = Math.random();
    let type = 'normal';
    if (rand > 0.82) {
      type = 'golden';
    } else if (rand < 0.3) {
      type = 'rock';
    }

    const item = {
      x: 30 + Math.random() * (canvas.width - 60),
      y: -20,
      radius: type === 'golden' ? 14 : (type === 'rock' ? 16 : 13),
      type: type,
      speed: 2.5 + Math.random() * 2.8
    };

    fallingItems.push(item);
  }

  function drawDinoPlayer() {
    if (!ctx) return;
    ctx.save();
    ctx.translate(playerDino.x + playerDino.width / 2, playerDino.y + playerDino.height / 2);

    if (playerDino.facing === 'left') {
      ctx.scale(-1, 1);
    }

    ctx.fillStyle = '#40916c';
    ctx.beginPath();
    ctx.ellipse(0, 5, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#52b788';
    ctx.beginPath();
    ctx.ellipse(18, -12, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#121c16';
    ctx.beginPath();
    ctx.arc(22, -14, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2d6a4f';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-20, 5);
    ctx.quadraticCurveTo(-35, 10, -32, -5);
    ctx.stroke();

    ctx.fillStyle = '#1f4d30';
    ctx.fillRect(-12, 18, 8, 12);
    ctx.fillRect(8, 18, 8, 12);

    ctx.fillStyle = '#a36639';
    ctx.beginPath();
    ctx.arc(-2, -2, 16, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#52301c';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  function drawBackground() {
    if (!ctx || !canvas) return;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#0d1f14');
    skyGrad.addColorStop(0.7, '#163823');
    skyGrad.addColorStop(1, '#271911');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(40, 20, 15, 0.7)';
    ctx.beginPath();
    ctx.moveTo(80, 420);
    ctx.lineTo(200, 240);
    ctx.lineTo(320, 420);
    ctx.fill();

    ctx.fillStyle = '#e85d04';
    ctx.beginPath();
    ctx.arc(200, 240, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#382114';
    ctx.fillRect(0, 390, canvas.width, 30);
    ctx.fillStyle = '#1f4d30';
    ctx.fillRect(0, 390, canvas.width, 6);

    ctx.fillStyle = '#52b788';
    for (let i = 10; i < canvas.width; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 390);
      ctx.lineTo(i + 5, 375);
      ctx.lineTo(i + 10, 390);
      ctx.fill();
    }
  }

  function drawItems() {
    if (!ctx) return;
    fallingItems.forEach(item => {
      ctx.save();
      ctx.translate(item.x, item.y);

      if (item.type === 'normal') {
        ctx.fillStyle = '#74c69d';
        ctx.beginPath();
        ctx.ellipse(0, 0, item.radius, item.radius * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2d6a4f';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#1f4d30';
        ctx.beginPath();
        ctx.arc(-3, -2, 2, 0, Math.PI * 2);
        ctx.arc(4, 3, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'golden') {
        ctx.fillStyle = '#ffba08';
        ctx.shadowColor = '#faa307';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, item.radius, item.radius * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (item.type === 'rock') {
        ctx.fillStyle = '#382114';
        ctx.shadowColor = '#d90429';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e85d04';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  function updateGamePhysics() {
    if (!canvas) return;

    if (keys.ArrowLeft || keys.KeyA) {
      playerDino.x -= playerDino.speed;
      playerDino.facing = 'left';
    }
    if (keys.ArrowRight || keys.KeyD) {
      playerDino.x += playerDino.speed;
      playerDino.facing = 'right';
    }

    if (playerDino.x < 10) playerDino.x = 10;
    if (playerDino.x > canvas.width - playerDino.width - 10) {
      playerDino.x = canvas.width - playerDino.width - 10;
    }

    for (let i = fallingItems.length - 1; i >= 0; i--) {
      const item = fallingItems[i];
      item.y += item.speed;

      const dinoCenterX = playerDino.x + playerDino.width / 2;
      const dinoCenterY = playerDino.y + playerDino.height / 2;
      const dist = Math.hypot(item.x - dinoCenterX, item.y - dinoCenterY);

      if (dist < item.radius + playerDino.width / 2 - 10) {
        if (item.type === 'normal') {
          eggScore += 10;
          soundMgr.playCatch(false);
        } else if (item.type === 'golden') {
          eggScore += 25;
          soundMgr.playCatch(true);
        } else if (item.type === 'rock') {
          eggScore = Math.max(0, eggScore - 15);
          soundMgr.playHit();
        }

        if (scoreDisplay) scoreDisplay.textContent = eggScore;
        fallingItems.splice(i, 1);
        continue;
      }

      if (item.y > canvas.height + 20) {
        fallingItems.splice(i, 1);
      }
    }
  }

  let spawnTimer = 0;
  function gameLoop() {
    if (!isEggGameRunning) return;

    spawnTimer++;
    if (spawnTimer % 28 === 0) {
      spawnFallingItem();
    }

    updateGamePhysics();
    drawBackground();
    drawItems();
    drawDinoPlayer();

    eggAnimationId = requestAnimationFrame(gameLoop);
  }

  function startEggGame() {
    const ready = confirm('🦖 Siap memulai tantangan mengumpulkan telur prasejarah selama 30 detik?');
    if (!ready) {
      return;
    }

    soundMgr.playRoar('trex');

    isEggGameRunning = true;
    eggScore = 0;
    eggTimeLeft = GAME_DURATION;
    fallingItems = [];

    if (scoreDisplay) scoreDisplay.textContent = '0';
    if (timerDisplay) timerDisplay.textContent = `${eggTimeLeft}s`;
    if (overlay) overlay.classList.add('hidden');

    if (canvas) canvas.focus();

    clearInterval(eggTimerInterval);
    eggTimerInterval = setInterval(() => {
      eggTimeLeft--;
      if (timerDisplay) timerDisplay.textContent = `${eggTimeLeft}s`;

      if (eggTimeLeft <= 0) {
        endEggGame();
      }
    }, 1000);

    cancelAnimationFrame(eggAnimationId);
    gameLoop();
  }

  function endEggGame() {
    isEggGameRunning = false;
    clearInterval(eggTimerInterval);
    cancelAnimationFrame(eggAnimationId);

    if (eggScore > eggHighScore) {
      eggHighScore = eggScore;
      if (highScoreDisplay) highScoreDisplay.textContent = eggHighScore;
    }

    if (overlay) {
      overlay.classList.remove('hidden');
      if (overlayTitle) overlayTitle.textContent = `Waktu Habis! Skor: ${eggScore}`;
      if (overlayDesc) {
        overlayDesc.innerHTML = `Selamat! Anda berhasil mengumpulkan skor <strong>${eggScore} poin</strong>.<br>Skor Tertinggi Anda: <strong>${eggHighScore}</strong>`;
      }
    }

    setTimeout(() => {
      alert(`⏱️ PERMAINAN SELESAI!\n\nSkor Akhir Anda: ${eggScore} Poin\nSkor Terbaik: ${eggHighScore} Poin!`);
      const playAgain = confirm('Ingin bermain lagi untuk memecahkan rekor skor tertinggi?');
      if (playAgain) {
        startEggGame();
      }
    }, 100);
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      keys.ArrowLeft = true;
      keys.KeyA = true;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      keys.ArrowRight = true;
      keys.KeyD = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      keys.ArrowLeft = false;
      keys.KeyA = false;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      keys.ArrowRight = false;
      keys.KeyD = false;
    }
  });

  if (btnTouchLeft) {
    btnTouchLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; });
    btnTouchLeft.addEventListener('touchend', () => { keys.ArrowLeft = false; });
    btnTouchLeft.addEventListener('mousedown', () => { keys.ArrowLeft = true; });
    btnTouchLeft.addEventListener('mouseup', () => { keys.ArrowLeft = false; });
  }

  if (btnTouchRight) {
    btnTouchRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; });
    btnTouchRight.addEventListener('touchend', () => { keys.ArrowRight = false; });
    btnTouchRight.addEventListener('mousedown', () => { keys.ArrowRight = true; });
    btnTouchRight.addEventListener('mouseup', () => { keys.ArrowRight = false; });
  }

  if (btnStartEggGame) {
    btnStartEggGame.addEventListener('click', startEggGame);
  }

  if (ctx && canvas) {
    drawBackground();
    drawDinoPlayer();
  }


  /* ==========================================================================
     8. MINI GAME C: KUIS PENGETAHUAN DINOSAURUS (10 SOAL LENGKAP)
     ========================================================================== */
  const kuisQuestions = [
    {
      q: 'Pada zaman prasejarah manakah dinosaurus pertama kali berevolusi di Bumi?',
      options: [
        'Zaman Jura (Jurassic)',
        'Zaman Trias (Triassic)',
        'Zaman Kapur (Cretaceous)',
        'Zaman Karbon (Carboniferous)'
      ],
      correct: 1,
      explanation: 'Dinosaurus pertama berevolusi sekitar 240-230 juta tahun lalu pada zaman Trias dari reptil archosaurus.'
    },
    {
      q: 'Apakah arti secara harfiah dari nama ilmiah "Tyrannosaurus Rex"?',
      options: [
        'Kadal Raksasa Bertanduk',
        'Pemburu Gesit Purba',
        'Raja Kadal yang Tirani / Kejam',
        'Pemakan Daging Berbisa'
      ],
      correct: 2,
      explanation: 'Tyrannos (tiran/kejam), sauros (kadal), dan rex (raja).'
    },
    {
      q: 'Pada periode manakah Tyrannosaurus Rex (T-Rex) hidup dan menguasai puncak rantai makanan?',
      options: [
        'Zaman Kapur Akhir (Late Cretaceous)',
        'Zaman Jura Awal (Early Jurassic)',
        'Zaman Trias Akhir (Late Triassic)',
        'Zaman Es (Pleistocene)'
      ],
      correct: 0,
      explanation: 'T-Rex hidup sekitar 68 hingga 66 juta tahun lalu di akhir zaman Kapur di Amerika Utara.'
    },
    {
      q: 'Dinosaurus herbivora manakah yang memiliki ciri khas tiga tanduk dan perisai leher dari tulang keras?',
      options: [
        'Ankylosaurus',
        'Brachiosaurus',
        'Triceratops',
        'Iguanodon'
      ],
      correct: 2,
      explanation: 'Triceratops berarti "wajah bertanduk tiga", dengan rumbai tulang keras di lehernya.'
    },
    {
      q: 'Apakah nama sebutan untuk senjata empat duri tajam di ujung ekor Stegosaurus?',
      options: [
        'Thagomizer',
        'Osteoderm',
        'Gastralia',
        'Furcula'
      ],
      correct: 0,
      explanation: 'Duri ekor Stegosaurus secara informal dan ilmiah dinamai "thagomizer".'
    },
    {
      q: 'Keturunan dinosaurus apakah yang berhasil selamat dari kepunahan massal dan hidup bersama kita saat ini?',
      options: [
        'Buaya dan Aligator',
        'Kadal Komodo',
        'Burung (Aves)',
        'Kura-kura Raksasa'
      ],
      correct: 2,
      explanation: 'Secara filogenetika modern, burung adalah dinosaurus theropoda avian yang masih bertahan.'
    },
    {
      q: 'Kawah asteroid raksasa Chicxulub yang memicu kepunahan dinosaurus 66 juta tahun lalu terletak di negara mana?',
      options: [
        'Meksiko (Semenanjung Yucatan)',
        'Amerika Serikat (Arizona)',
        'Australia',
        'Rusia (Siberia)'
      ],
      correct: 0,
      explanation: 'Kawah Chicxulub berdiameter ±180 km terletak di Semenanjung Yucatan, Meksiko.'
    },
    {
      q: 'Dinosaurus karnivora predator semi-akuatik terpanjang yang memiliki layar dorsal besar di punggungnya adalah...',
      options: [
        'Allosaurus',
        'Spinosaurus',
        'Carnotaurus',
        'Giganotosaurus'
      ],
      correct: 1,
      explanation: 'Spinosaurus aegyptiacus memiliki panjang hingga 15-18 meter dengan moncong mirip buaya pemakan ikan.'
    },
    {
      q: 'Mengapa Brachiosaurus memiliki postur tubuh yang unik dibanding sauropoda lainnya?',
      options: [
        'Kaki belakangnya jauh lebih panjang',
        'Kaki depannya lebih panjang daripada kaki belakang',
        'Memiliki sayap lebar untuk meluncur',
        'Hanya berjalan dengan dua kaki (bipedal)'
      ],
      correct: 1,
      explanation: 'Kaki depan yang lebih panjang membuat leher Brachiosaurus menjulang tinggi seperti jerapah raksasa.'
    },
    {
      q: 'Penemuan fosil modern membuktikan bahwa dinosaurus lincah seperti Velociraptor memiliki penutup tubuh berupa apa?',
      options: [
        'Sisik tebal seperti buaya purba',
        'Bulu (proto-feathers / bulu sejati)',
        'Kulit lendir kedap air',
        'Baja tanduk osteoderm'
      ],
      correct: 1,
      explanation: 'Ditemukannya nodul bulu (quill knobs) pada tulang fosil lengan Velociraptor membuktikan keberadaan bulu sejati.'
    }
  ];

  let kuisCurrentStep = 0;
  let userKuisAnswers = new Array(kuisQuestions.length).fill(null);

  const kuisProgressText = document.getElementById('kuisProgressText');
  const questionNumberBadge = document.getElementById('questionNumberBadge');
  const questionText = document.getElementById('questionText');
  const kuisOptionsContainer = document.getElementById('kuisOptionsContainer');
  const btnNextKuis = document.getElementById('btnNextKuis');
  const btnPrevKuis = document.getElementById('btnPrevKuis');
  const kuisBody = document.getElementById('kuisBody');
  const kuisResultBox = document.getElementById('kuisResultBox');

  const finalScoreVal = document.getElementById('finalScoreVal');
  const correctAnswersCount = document.getElementById('correctAnswersCount');
  const resultCategoryName = document.getElementById('resultCategoryName');
  const resultEvaluationDesc = document.getElementById('resultEvaluationDesc');
  const resultIcon = document.getElementById('resultIcon');
  const btnRetakeKuis = document.getElementById('btnRetakeKuis');

  function renderKuisQuestion() {
    const qData = kuisQuestions[kuisCurrentStep];

    if (kuisProgressText) kuisProgressText.textContent = `${kuisCurrentStep + 1} / ${kuisQuestions.length}`;
    if (questionNumberBadge) questionNumberBadge.textContent = `Pertanyaan ${kuisCurrentStep + 1}`;
    if (questionText) questionText.textContent = qData.q;

    if (kuisOptionsContainer) {
      kuisOptionsContainer.innerHTML = '';
      const letters = ['A', 'B', 'C', 'D'];

      qData.options.forEach((optText, idx) => {
        const item = document.createElement('div');
        item.classList.add('kuis-option-item');
        if (userKuisAnswers[kuisCurrentStep] === idx) {
          item.classList.add('selected');
        }

        item.innerHTML = `
          <div class="option-letter-badge">${letters[idx]}</div>
          <div class="option-text">${optText}</div>
        `;

        item.addEventListener('click', () => {
          userKuisAnswers[kuisCurrentStep] = idx;
          soundMgr.playCatch(false);

          document.querySelectorAll('.kuis-option-item').forEach(el => el.classList.remove('selected'));
          item.classList.add('selected');

          if (btnNextKuis) {
            btnNextKuis.disabled = false;
            btnNextKuis.textContent = (kuisCurrentStep === kuisQuestions.length - 1) ? 'Selesaikan Kuis 🏁' : 'Selanjutnya ➡️';
          }
        });

        kuisOptionsContainer.appendChild(item);
      });
    }

    if (btnPrevKuis) {
      btnPrevKuis.style.display = kuisCurrentStep > 0 ? 'inline-flex' : 'none';
    }

    if (btnNextKuis) {
      if (userKuisAnswers[kuisCurrentStep] !== null) {
        btnNextKuis.disabled = false;
        btnNextKuis.textContent = (kuisCurrentStep === kuisQuestions.length - 1) ? 'Selesaikan Kuis 🏁' : 'Selanjutnya ➡️';
      } else {
        btnNextKuis.disabled = true;
        btnNextKuis.textContent = 'Pilih Jawaban Dulu';
      }
    }
  }

  function finishKuis() {
    let correctCount = 0;
    kuisQuestions.forEach((q, idx) => {
      if (userKuisAnswers[idx] === q.correct) {
        correctCount++;
      }
    });

    const scorePercentage = (correctCount / kuisQuestions.length) * 100;

    let category = '';
    let evalText = '';
    let icon = '🏆';

    if (scorePercentage >= 90) {
      category = '🦖 Master Paleontologi Legendaris';
      evalText = 'Luar biasa sempurna! Kamu memiliki pemahaman ensiklopedis mengenai zaman prasejarah, anatomi, dan kepunahan dinosaurus.';
      icon = '🦖';
    } else if (scorePercentage >= 70) {
      category = '🦕 Peneliti Fosil Handal';
      evalText = 'Sangat hebat! Pengetahuanmu tentang era Mesozoikum dan fauna purba sangat solid dan mengagumkan.';
      icon = '🦕';
    } else if (scorePercentage >= 50) {
      category = '🌿 Penjelajah Hutan Purba';
      evalText = 'Cukup baik! Kamu sudah memahami dasar-dasar kehidupan dinosaurus, terus tingkatkan dengan membaca galeri jenis dino.';
      icon = '🌿';
    } else {
      category = '🥚 Anak Dino Pemula';
      evalText = 'Jangan berkecil hati! Dunia dinosaurus sangat luas. Baca kembali kronologi zaman Trias, Jura, Kapur, dan coba lagi kuis ini.';
      icon = '🥚';
    }

    if (kuisBody) kuisBody.style.display = 'none';
    if (kuisResultBox) kuisResultBox.style.display = 'block';

    if (finalScoreVal) finalScoreVal.textContent = scorePercentage;
    if (correctAnswersCount) correctAnswersCount.textContent = correctCount;
    if (resultCategoryName) resultCategoryName.textContent = category;
    if (resultEvaluationDesc) resultEvaluationDesc.textContent = evalText;
    if (resultIcon) resultIcon.textContent = icon;

    // Putar raungan T-Rex jika nilai tinggi, atau efek catch
    if (scorePercentage >= 70) {
      soundMgr.playRoar('trex');
    } else {
      soundMgr.playCatch(true);
    }

    setTimeout(() => {
      alert(`🎯 KUIS SELESAI!\n\nJumlah Benar: ${correctCount} / 10\nNilai Akhir: ${scorePercentage}\nKategori: ${category}\n\n${evalText}`);
    }, 200);
  }

  if (btnNextKuis) {
    btnNextKuis.addEventListener('click', () => {
      if (userKuisAnswers[kuisCurrentStep] === null) return;

      if (kuisCurrentStep < kuisQuestions.length - 1) {
        kuisCurrentStep++;
        renderKuisQuestion();
      } else {
        finishKuis();
      }
    });
  }

  if (btnPrevKuis) {
    btnPrevKuis.addEventListener('click', () => {
      if (kuisCurrentStep > 0) {
        kuisCurrentStep--;
        renderKuisQuestion();
      }
    });
  }

  if (btnRetakeKuis) {
    btnRetakeKuis.addEventListener('click', () => {
      const willRetake = confirm('Apakah Anda yakin ingin mengulang kuis pengetahuan dinosaurus dari awal?');
      if (willRetake) {
        kuisCurrentStep = 0;
        userKuisAnswers = new Array(kuisQuestions.length).fill(null);
        if (kuisResultBox) kuisResultBox.style.display = 'none';
        if (kuisBody) kuisBody.style.display = 'block';
        renderKuisQuestion();
      }
    });
  }

  renderKuisQuestion();

  // Tab Navigasi Mini Game
  const gameTabBtns = document.querySelectorAll('.game-tab-btn');
  const gameTabContents = document.querySelectorAll('.game-tab-content');

  gameTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      soundMgr.stopAll();
      const targetTabId = btn.getAttribute('data-tab');

      gameTabBtns.forEach(b => b.classList.remove('active'));
      gameTabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetTabId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });


  /* ==========================================================================
     9. FORMULIR PENGUNJUNG, VALIDASI & KARTU TANDA PENGENAL
     ========================================================================== */
  const visitorForm = document.getElementById('visitorForm');
  const visitorNameInput = document.getElementById('visitorName');
  const visitorAgeInput = document.getElementById('visitorAge');
  const visitorOriginInput = document.getElementById('visitorOrigin');
  const favoriteDinoSelect = document.getElementById('favoriteDino');
  const visitorMessageInput = document.getElementById('visitorMessage');
  const visitorAgreementInput = document.getElementById('visitorAgreement');

  // Preview Card Elements
  const previewName = document.getElementById('previewName');
  const previewAge = document.getElementById('previewAge');
  const previewOrigin = document.getElementById('previewOrigin');
  const previewDinoFav = document.getElementById('previewDinoFav');
  const previewQuote = document.getElementById('previewQuote');
  const previewDinoAvatar = document.getElementById('previewDinoAvatar');
  const licenseIdDisplay = document.getElementById('licenseIdDisplay');
  const licenseDateDisplay = document.getElementById('licenseDateDisplay');
  const licenseCardPreview = document.getElementById('licenseCardPreview');
  const explorersTableBody = document.getElementById('explorersTableBody');

  if (licenseDateDisplay) {
    const today = new Date();
    licenseDateDisplay.textContent = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  }

  const explorersList = [
    { name: 'Prof. Alan Grant', age: 42, dino: 'Velociraptor', time: '10:15' },
    { name: 'Dr. Ellie Sattler', age: 36, dino: 'Triceratops', time: '11:30' }
  ];

  function renderExplorersTable() {
    if (!explorersTableBody) return;
    explorersTableBody.innerHTML = '';
    explorersList.forEach((exp, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td><strong>${exp.name}</strong></td>
        <td>${exp.age} Thn</td>
        <td><span class="text-accent">${exp.dino}</span></td>
        <td>${exp.time}</td>
      `;
      explorersTableBody.appendChild(tr);
    });
  }

  renderExplorersTable();

  function getDinoAvatar(dinoName) {
    if (!dinoName) return '🦕';
    const lower = dinoName.toLowerCase();
    if (lower.includes('t-rex') || lower.includes('tyrannosaurus')) return '🦖';
    if (lower.includes('triceratops')) return '🦏';
    if (lower.includes('velociraptor')) return '🦅';
    if (lower.includes('brachiosaurus')) return '🦕';
    if (lower.includes('stegosaurus')) return '🛡️';
    if (lower.includes('spinosaurus')) return '🐊';
    return '🦕';
  }

  function getDinoAudioKey(dinoName) {
    if (!dinoName) return 'trex';
    const lower = dinoName.toLowerCase();
    if (lower.includes('t-rex') || lower.includes('tyrannosaurus')) return 'trex';
    if (lower.includes('triceratops')) return 'triceratops';
    if (lower.includes('velociraptor')) return 'velociraptor';
    if (lower.includes('brachiosaurus')) return 'brachiosaurus';
    if (lower.includes('stegosaurus')) return 'stegosaurus';
    if (lower.includes('spinosaurus')) return 'spinosaurus';
    return 'trex';
  }

  if (visitorForm) {
    visitorForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;

      // 1. Validasi Nama
      const nameVal = visitorNameInput.value.trim();
      const errName = document.getElementById('errVisitorName');
      if (nameVal.length < 3) {
        visitorNameInput.classList.add('is-invalid');
        if (errName) errName.classList.add('show');
        isValid = false;
      } else {
        visitorNameInput.classList.remove('is-invalid');
        if (errName) errName.classList.remove('show');
      }

      // 2. Validasi Umur
      const ageVal = parseInt(visitorAgeInput.value, 10);
      const errAge = document.getElementById('errVisitorAge');
      if (isNaN(ageVal) || ageVal < 5 || ageVal > 100) {
        visitorAgeInput.classList.add('is-invalid');
        if (errAge) errAge.classList.add('show');
        isValid = false;
      } else {
        visitorAgeInput.classList.remove('is-invalid');
        if (errAge) errAge.classList.remove('show');
      }

      // 3. Validasi Dino Favorit
      const dinoVal = favoriteDinoSelect.value;
      const errDino = document.getElementById('errFavoriteDino');
      if (!dinoVal) {
        favoriteDinoSelect.classList.add('is-invalid');
        if (errDino) errDino.classList.add('show');
        isValid = false;
      } else {
        favoriteDinoSelect.classList.remove('is-invalid');
        if (errDino) errDino.classList.remove('show');
      }

      // 4. Validasi Checkbox Persetujuan
      const errAgreement = document.getElementById('errVisitorAgreement');
      if (!visitorAgreementInput.checked) {
        if (errAgreement) errAgreement.classList.add('show');
        isValid = false;
      } else {
        if (errAgreement) errAgreement.classList.remove('show');
      }

      if (!isValid) {
        alert('⚠️ Formulir belum lengkap! Harap periksa kembali isian berwarna merah.');
        return;
      }

      const originVal = visitorOriginInput.value.trim() || 'Ekspedisi Bebas Dino World';
      const quoteVal = visitorMessageInput.value.trim() || 'Siap menguak misteri zaman purba di Dino World!';
      const randomCode = Math.floor(1000 + Math.random() * 9000);

      if (previewName) previewName.textContent = nameVal;
      if (previewAge) previewAge.textContent = `${ageVal} Tahun`;
      if (previewOrigin) previewOrigin.textContent = originVal;
      if (previewDinoFav) previewDinoFav.textContent = dinoVal;
      if (previewQuote) previewQuote.textContent = `"${quoteVal}"`;
      if (previewDinoAvatar) previewDinoAvatar.textContent = getDinoAvatar(dinoVal);
      if (licenseIdDisplay) licenseIdDisplay.textContent = `ID: DW-2026-${randomCode}`;

      if (licenseCardPreview) {
        licenseCardPreview.classList.add('btn-pulse');
        setTimeout(() => licenseCardPreview.classList.remove('btn-pulse'), 2000);
      }

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      explorersList.unshift({
        name: nameVal,
        age: ageVal,
        dino: dinoVal.split('-')[0].trim(),
        time: timeStr
      });
      renderExplorersTable();

      // Putar raungan dinosaurus favorit penjelajah yang baru didaftarkan!
      const favKey = getDinoAudioKey(dinoVal);
      soundMgr.playRoar(favKey);

      // JAVASCRIPT ALERT SUKSES
      alert(`🎉 SELAMAT, ${nameVal.toUpperCase()}!\n\nKartu Tanda Pengenal Penjelajah Prasejarah Anda telah resmi diterbitkan dengan ID: DW-2026-${randomCode}.\n\nDinosaurus Favorit: ${dinoVal}\n\nSilakan cek tampilan kartu Anda di sisi kanan formulir.`);

      if (licenseCardPreview) {
        licenseCardPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

});
