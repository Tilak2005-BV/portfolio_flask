/* ============================================
   TILAK BV PORTFOLIO — MAIN JAVASCRIPT
   Backend: Flask /contact endpoint
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {

  // ===== TRAVELING DOTS BACKGROUND ANIMATION =====
  const canvas = document.getElementById("dotCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let particlesArray = [];
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    });

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x > canvas.width) this.x = 0;
        else if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        else if (this.y < 0) this.y = canvas.height;
      }
      draw() {
        const currentTheme = document.body.getAttribute("data-theme");
        ctx.fillStyle = currentTheme === "dark" 
          ? "rgba(255, 255, 255, 0.4)" 
          : "rgba(0, 0, 0, 0.3)";      
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initParticles() {
      particlesArray = [];
      const numberOfParticles = (canvas.width * canvas.height) / 9000; 
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();
  }

  // ===== THEME TOGGLE =====
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon   = document.getElementById("themeIcon");
  const body        = document.body;

  const savedTheme = localStorage.getItem("theme") || "dark";
  body.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener("click", () => {
    const next = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateThemeIcon(next);
  });

  function updateThemeIcon(theme) {
    if(themeIcon) {
       themeIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
    }
  }

  // ===== MOBILE MENU =====
  const menuToggle = document.getElementById("menuToggle");
  const navLinks   = document.getElementById("navLinks");

  if(menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      menuToggle.classList.toggle("active");
      navLinks.classList.toggle("open");
    });

    document.querySelectorAll(".nav-links > a.nav-link, .dropdown-content a").forEach(link => {
      link.addEventListener("click", () => {
        menuToggle.classList.remove("active");
        navLinks.classList.remove("open");
      });
    });
  }

  // ===== SMART NAVBAR SCROLL (AUTO-HIDE) =====
  const navbar = document.getElementById("navbar");
  let lastScrollY = window.scrollY;

  if(navbar) {
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 50);

      if (window.scrollY > 150) { 
        if (window.scrollY > lastScrollY) {
          navbar.classList.add("hidden-nav");
        } else {
          navbar.classList.remove("hidden-nav");
        }
      } else {
        navbar.classList.remove("hidden-nav");
      }
      
      lastScrollY = window.scrollY;
    });
  }

  // ===== ACTIVE NAV ON SCROLL =====
  const sections = document.querySelectorAll("section[id]");
  const navItems  = document.querySelectorAll(".nav-link:not(.nav-dropdown > .nav-link)");

  if (typeof IntersectionObserver !== "undefined") {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navItems.forEach(item => {
            if (item.getAttribute("href") && item.getAttribute("href").includes(`#${id}`)) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
          });
        }
      });
    }, { rootMargin: "-50% 0px -50% 0px" });
    
    sections.forEach(s => navObserver.observe(s));
  }

  // ===== TYPING ANIMATION =====
  const roles = [
    "Full-Stack Apps",
    "AI Systems",
    "Data Pipelines",
    "Web Interfaces",
    "Backend APIs",
    "Smart Solutions"
  ];
  let roleIdx = 0, charIdx = 0, isDeleting = false;
  const typingEl = document.getElementById("typingText");

  function type() {
    if (!typingEl) return;
    const current = roles[roleIdx];
    typingEl.textContent = isDeleting
      ? current.substring(0, --charIdx)
      : current.substring(0, ++charIdx);

    let delay = isDeleting ? 60 : 100;
    if (!isDeleting && charIdx === current.length) { delay = 2000; isDeleting = true; }
    else if (isDeleting && charIdx === 0) { isDeleting = false; roleIdx = (roleIdx + 1) % roles.length; delay = 400; }
    setTimeout(type, delay);
  }
  type();

  // ===== AOS ANIMATION INTERSECTION =====
  if (typeof IntersectionObserver !== "undefined") {
    const aosObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.getAttribute("data-aos-delay") || 0);
          setTimeout(() => el.classList.add("aos-animate"), delay);
          aosObserver.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll("[data-aos]").forEach(el => aosObserver.observe(el));
  }

  // ===== SKILL BAR ANIMATION =====
  if (typeof IntersectionObserver !== "undefined") {
    const skillObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll(".skill-fill").forEach(bar => bar.classList.add("animated"));
          skillObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll(".skill-card").forEach(card => skillObserver.observe(card));
  }

  // ===== SKILL TAB FILTER =====
  document.querySelectorAll(".skill-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".skill-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const filter = tab.getAttribute("data-tab");
      document.querySelectorAll(".skill-card").forEach(card => {
        card.classList.toggle("filtered-out", filter !== "all" && card.getAttribute("data-category") !== filter);
      });
    });
  });

  // ===== 3D BLOG CAROUSEL: RUMMY SHUFFLE & FLAT MODE (For blogs.html) =====
  const carousel3d = document.getElementById('blogCarousel');
  if (carousel3d) {
    const items = carousel3d.querySelectorAll('.carousel-item');
    const numItems = items.length;
    const angle = 360 / numItems;
    
    // Calculates perfect radius for a 300px card width based on the number of items
    const radius = Math.round((320 / 2) / Math.tan(Math.PI / numItems)) + 60; 
    
    let currIndex = 0;
    let rotationInterval;
    let is3DMode = true;
    let isAnimating = false;

    const dotsContainer = document.getElementById('carouselDots');
    const btnShuffle = document.getElementById('btnShuffle');
    const btnBack3D = document.getElementById('btnBack3D');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const mode3DControls = document.getElementById('mode3DControls');
    const modeFlatControls = document.getElementById('modeFlatControls');

    // Dot Creation
    if (dotsContainer) {
      dotsContainer.innerHTML = ''; 
      items.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.classList.add('carousel-dot');
        dot.addEventListener('click', () => {
          if(!is3DMode || isAnimating) return;
          currIndex = i;
          updateTransforms();
          updateDots();
          stopAutoRotate();
          startAutoRotate();
        });
        dotsContainer.appendChild(dot);
      });
    }

    function updateDots() {
      if (!dotsContainer) return;
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      dots.forEach(d => d.classList.remove('active'));
      let activeIdx = ((currIndex % numItems) + numItems) % numItems;
      if(dots[activeIdx]) dots[activeIdx].classList.add('active');
    }

    // Core transform function based on mode
    function updateTransforms() {
        if (is3DMode) {
            carousel3d.style.transform = `translateZ(${-radius}px) rotateY(${currIndex * -angle}deg)`;
            items.forEach((item, i) => {
                item.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                item.style.transform = `rotateY(${i * angle}deg) translateZ(${radius}px)`;
                item.style.zIndex = 'auto'; // Reset zIndex for 3D
            });
        } else {
            // Flat mode
            carousel3d.style.transform = `translateZ(0) rotateY(0)`;
            items.forEach((item, i) => {
                item.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                
                let offset = (i - currIndex);
                // Smart math to create an infinite loop array effect horizontally
                if (offset > Math.floor(numItems / 2)) offset -= numItems;
                if (offset < -Math.floor(numItems / 2)) offset += numItems;
                
                // Stack cards visually to the left and right, center card is front
                item.style.transform = `translateX(${offset * 350}px) translateZ(${Math.abs(offset) * -50}px) rotateY(${offset * -5}deg)`;
                item.style.zIndex = 100 - Math.abs(offset); 
            });
        }
    }

    function startAutoRotate() {
        if(!is3DMode) return;
        clearInterval(rotationInterval);
        rotationInterval = setInterval(() => {
            currIndex++;
            updateTransforms();
            updateDots();
        }, 3500);
    }

    function stopAutoRotate() {
        clearInterval(rotationInterval);
    }

    carousel3d.addEventListener('mouseenter', stopAutoRotate);
    carousel3d.addEventListener('mouseleave', startAutoRotate);

    // --- RUMMY SHUFFLE TO HORIZONTAL MODE ---
    if(btnShuffle) {
        btnShuffle.addEventListener('click', () => {
            if(isAnimating) return;
            isAnimating = true;
            is3DMode = false;
            stopAutoRotate();
            
            mode3DControls.classList.remove('active-mode-controls');
            mode3DControls.classList.add('hidden-mode-controls');
            modeFlatControls.classList.remove('hidden-mode-controls');
            modeFlatControls.classList.add('active-mode-controls');

            // Phase 1: Messy Stack (The Gather)
            carousel3d.style.transform = `translateZ(0) rotateY(0)`;
            items.forEach((item, i) => {
                item.style.transition = 'transform 0.5s ease';
                // Stack centrally with a random tilt
                item.style.transform = `translateX(0) translateZ(${-i}px) rotateZ(${(Math.random() * 20) - 10}deg)`;
            });

            // Phase 2: Deal out horizontally one by one
            setTimeout(() => {
                items.forEach((item, i) => {
                    setTimeout(() => {
                        item.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                        
                        let offset = (i - currIndex);
                        if (offset > Math.floor(numItems / 2)) offset -= numItems;
                        if (offset < -Math.floor(numItems / 2)) offset += numItems;
                        
                        item.style.transform = `translateX(${offset * 350}px) translateZ(${Math.abs(offset) * -50}px) rotateY(${offset * -5}deg) rotateZ(0)`;
                        item.style.zIndex = 100 - Math.abs(offset);
                    }, i * 150); // Staggered deal time
                });
                
                // Unlock animation lock when done
                setTimeout(() => { isAnimating = false; }, numItems * 150 + 600);
            }, 600);
        });
    }

    // --- BACK TO 3D MODE ---
    if(btnBack3D) {
        btnBack3D.addEventListener('click', () => {
            if(isAnimating) return;
            is3DMode = true;
            
            modeFlatControls.classList.remove('active-mode-controls');
            modeFlatControls.classList.add('hidden-mode-controls');
            mode3DControls.classList.remove('hidden-mode-controls');
            mode3DControls.classList.add('active-mode-controls');

            updateTransforms();
            updateDots();
            startAutoRotate();
        });
    }

    // Horizontal Controls
    if(btnPrev) {
        btnPrev.addEventListener('click', () => {
            if(isAnimating) return;
            currIndex--;
            updateTransforms();
        });
    }
    if(btnNext) {
        btnNext.addEventListener('click', () => {
            if(isAnimating) return;
            currIndex++;
            updateTransforms();
        });
    }

    // Start
    updateTransforms();
    updateDots();
    startAutoRotate();
  }

  // ===== DYNAMIC MODAL (CERTIFICATES) =====
  const dynamicCertModal = document.getElementById("dynamicCertModal");
  const dynamicCertImage = document.getElementById("dynamicCertImage");
  
  if(dynamicCertModal && dynamicCertImage) {
    document.querySelectorAll('.view-cert-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const imgSrc = btn.getAttribute('data-img');
        if(imgSrc) {
          dynamicCertImage.src = imgSrc;
          dynamicCertModal.style.display = 'flex';
        }
      });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal').style.display = 'none';
      });
    });
    
    // Close modal when clicking outside the image
    dynamicCertModal.addEventListener('click', (e) => {
      if (e.target === dynamicCertModal) {
        dynamicCertModal.style.display = 'none';
      }
    });
  }

  // ===== BACK TO TOP =====
  const backToTop = document.getElementById("backToTop");
  if(backToTop) {
     window.addEventListener("scroll", () => backToTop.classList.toggle("visible", window.scrollY > 400));
     backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // ===== CONTACT FORM HANDLING =====
  const contactForm = document.getElementById("contactForm");
  const submitBtn   = document.getElementById("submitBtn");
  const formSuccess = document.getElementById("formSuccess");
  const formError   = document.getElementById("formGlobalError");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();

      const name    = document.getElementById("cName");
      const email   = document.getElementById("cEmail");
      const subject = document.getElementById("cSubject");
      const message = document.getElementById("cMessage");

      let valid = true;
      if (!name.value.trim())    { showFieldError("nameError", "Name is required");       name.classList.add("error");    valid = false; }
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        showFieldError("emailError", "Valid email required"); email.classList.add("error"); valid = false;
      }
      if (!subject.value.trim()) { showFieldError("subjectError", "Subject is required"); subject.classList.add("error"); valid = false; }
      if (!message.value.trim()) { showFieldError("messageError", "Message is required"); message.classList.add("error"); valid = false; }
      if (!valid) return;

      setLoading(true);

      try {
        const res = await fetch("/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:    name.value.trim(),
            email:   email.value.trim(),
            subject: subject.value.trim(),
            message: message.value.trim()
          })
        });

        const data = await res.json();

        if (res.ok && data.success) {
          formSuccess.classList.remove("hidden");
          formSuccess.querySelector("span").textContent = data.message;
          contactForm.reset();
          setTimeout(() => formSuccess.classList.add("hidden"), 8000);
        } else {
          if (data.errors) {
            Object.entries(data.errors).forEach(([field, msg]) => {
              showFieldError(field + "Error", msg);
              const input = document.getElementById("c" + field.charAt(0).toUpperCase() + field.slice(1));
              if (input) input.classList.add("error");
            });
          }
          if (data.message && formError) {
            formError.querySelector("span").textContent = data.message;
            formError.classList.remove("hidden");
          }
        }
      } catch (err) {
        console.error("Network connection down: ", err);
        if (formError) {
          formError.querySelector("span").textContent = "Server connection lost. Please drop an email manually.";
          formError.classList.remove("hidden");
        }
      } finally {
        setLoading(false);
      }
    });
  }

  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.querySelector(".btn-text").classList.toggle("hidden", on);
    submitBtn.querySelector(".btn-loading").classList.toggle("hidden", !on);
    submitBtn.disabled = on;
  }

  function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  function clearErrors() {
    document.querySelectorAll(".field-error").forEach(e => e.textContent = "");
    document.querySelectorAll(".form-group input, .form-group textarea").forEach(el => el.classList.remove("error"));
    if (formSuccess) formSuccess.classList.add("hidden");
    if (formError) {
      formError.classList.add("hidden");
      const span = formError.querySelector("span");
      if (span) span.textContent = "";
    }
  }

  // ===== SCROLL PROGRESS BAR =====
  const scrollBar = document.getElementById("scrollProgressBar");
  if (scrollBar) {
    window.addEventListener("scroll", () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollBar.style.width = pct + "%";
    }, { passive: true });
  }

  // ===== GUESTBOOK LIVE TICKER (index.html only) =====
  const gbTickerTrack = document.getElementById("gbTickerTrack");
  if (gbTickerTrack) {
    async function loadTicker() {
      try {
        const res  = await fetch("/guestbook");
        const data = await res.json();
        const msgs = data.messages || [];
        if (msgs.length === 0) {
          gbTickerTrack.innerHTML = '<span class="gb-tick-item gb-tick-empty">✨ No messages yet — <a href="/blogs#guestbook">be the first!</a></span>';
          return;
        }
        // Define 30 vibrant colors for highlighting
        // Build items
        const buildItems = () => msgs.map((m) => {
          const rating = m.rating || 5;
          const starsHtml = Array(rating).fill('<i class="fas fa-star"></i>').join("") + 
                            Array(5 - rating).fill('<i class="far fa-star"></i>').join("");

          return `<div class="gb-tick-item">
            <div class="gb-tick-header">
              <span class="gb-tick-avatar">${(m.name||"?").charAt(0).toUpperCase()}</span>
              <div class="gb-tick-meta">
                <strong class="gb-tick-name">${escTicker(m.name)}</strong>
                <span class="gb-tick-time">${m.time || "Just now"}</span>
              </div>
            </div>
            <div class="gb-tick-rating">
              ${starsHtml}
            </div>
            <div class="gb-tick-msg-wrap">
              <span class="gb-tick-msg">"${escTicker(m.message)}"</span>
            </div>
          </div>`;
        }).join("");
        
        // Only duplicate and animate if we have enough cards to scroll
        if (msgs.length >= 4) {
          gbTickerTrack.innerHTML = buildItems() + buildItems();
          gbTickerTrack.style.animation = "gb-ticker-scroll 40s linear infinite";
        } else {
          gbTickerTrack.innerHTML = buildItems();
          gbTickerTrack.style.animation = "none";
          gbTickerTrack.style.justifyContent = "center";
          gbTickerTrack.style.width = "100%";
        }
      } catch (e) {
        console.error("Ticker load error:", e);
      }
    }
    function escTicker(str) {
      const d = document.createElement("div");
      d.appendChild(document.createTextNode(str));
      return d.innerHTML;
    }
    loadTicker();

    // Pause on hover — user can grab-scroll too
    const tickerWrap = document.getElementById("gbTickerStrip");
    if (tickerWrap) {
      tickerWrap.addEventListener("mouseenter", () => gbTickerTrack.style.animationPlayState = "paused");
      tickerWrap.addEventListener("mouseleave", () => gbTickerTrack.style.animationPlayState = "running");
    }
  }

  // ===== GUESTBOOK WALL =====
  const gbForm      = document.getElementById("guestbookForm");
  const gbNameInput = document.getElementById("gbName");
  const gbEmailInput = document.getElementById("gbEmail");
  const gbMsgInput  = document.getElementById("gbMsg");
  const gbCharCount = document.getElementById("gbCharCount");
  const gbFeedback  = document.getElementById("gbFeedback");
  const gbWall      = document.getElementById("guestbookWall");
  const gbLoading   = document.getElementById("gbLoading");

    // ── Render a card ───────────────
    function renderCard(entry) {
      const card = document.createElement("div");
      card.className = "gb-message-card tech-blur";
      card.dataset.id = entry.id;
      
      const rating = entry.rating || 5;
      const starsHtml = Array(rating).fill('<i class="fas fa-star"></i>').join("") + 
                        Array(5 - rating).fill('<i class="far fa-star"></i>').join("");

      card.innerHTML = `
        <div class="gb-card-header">
          <div style="display:flex; gap:12px; align-items:center;">
            <div class="gb-avatar">${getAvatar(entry.name)}</div>
            <div class="gb-card-meta">
              <div class="gb-name">${escapeHtml(entry.name)}</div>
              <div class="gb-time">${entry.time || "Just now"}</div>
            </div>
          </div>
        </div>
        <div class="gb-tick-rating" style="margin-bottom:12px;">${starsHtml}</div>
        <p class="gb-message-text">"${escapeHtml(entry.message)}"</p>
      `;
      return card;
    }



    // ── UI helpers ────────────────────────────────────────────────
    function getAvatar(name) { return (name || "?").charAt(0).toUpperCase(); }
    function escapeHtml(str) {
      const d = document.createElement("div");
      d.appendChild(document.createTextNode(str));
      return d.innerHTML;
    }
    function showGbFeedback(msg, type = "success") {
      if (!gbFeedback) {
        alert(msg);
        return;
      }
      gbFeedback.textContent = msg;
      gbFeedback.className = `gb-feedback ${type}`;
      gbFeedback.classList.remove("hidden");
      setTimeout(() => gbFeedback.classList.add("hidden"), 5000);
      
      // Fallback popup so they definitely see it
      if (type === "error" || type === "success") {
         setTimeout(() => alert(msg), 100);
      }
    }

    // ── Load messages & kudos ─────────────────────────────────────────────
    async function loadGuestbook() {
      try {
        const res  = await fetch("/guestbook");
        const data = await res.json();
        if (gbWall) {
          if (gbLoading) gbLoading.remove();
          gbWall.innerHTML = "";
          if (!data.messages || data.messages.length === 0) {
            gbWall.innerHTML = '<div class="gb-empty">✨ Be the first to leave a message!</div>';
          } else {
            data.messages.forEach(entry => gbWall.appendChild(renderCard(entry)));
          }
        }
      } catch (err) {
        console.error("Guestbook load error:", err);
        if (gbLoading) gbLoading.innerHTML = '<i class="fas fa-exclamation-circle"></i> Could not load messages.';
      }
    }

    // ── Form Submit ──────────────────────────────────────────────────────
    if (gbForm) {
      // Star Rating logic
      const gbRatingSelect = document.getElementById("gbRatingSelect");
      const gbRatingInput  = document.getElementById("gbRating");
      if (gbRatingSelect) {
        const stars = gbRatingSelect.querySelectorAll("i");
        // Initialize default
        const setStars = (val) => {
          stars.forEach(s => {
            if (parseInt(s.dataset.val) <= val) s.classList.add("active");
            else s.classList.remove("active");
          });
          if (gbRatingInput) gbRatingInput.value = val;
        };
        setStars(5);
        stars.forEach(star => {
          star.addEventListener("click", () => setStars(parseInt(star.dataset.val)));
        });
      }

      if (gbMsgInput && gbCharCount) {
        gbMsgInput.addEventListener("input", () => {
          gbCharCount.textContent = gbMsgInput.value.length;
        });
      }

      gbForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name    = gbNameInput ? gbNameInput.value.trim() : "";
        const email   = gbEmailInput ? gbEmailInput.value.trim() : "";
        const message = gbMsgInput  ? gbMsgInput.value.trim()  : "";
        const rating  = gbRatingInput ? parseInt(gbRatingInput.value) : 5;
        if (!name || !email || !message) { showGbFeedback("Please fill in your name, email, and a message.", "error"); return; }
        const submitBtn = document.getElementById("gbSubmitBtn");
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting…'; }
        try {
          const res  = await fetch("/guestbook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, message, rating })
          });
          
          const textData = await res.text();
          let data;
          try {
            data = JSON.parse(textData);
          } catch (parseErr) {
            throw new Error("Invalid response from server: " + textData.substring(0, 80));
          }
          
          if (res.ok && data.success) {
            gbForm.reset();
            if (gbCharCount) gbCharCount.textContent = "0";
            if (gbWall) {
              const empty = gbWall.querySelector(".gb-empty");
              if (empty) empty.remove();
              gbWall.insertBefore(renderCard(data.entry), gbWall.firstChild);
            }
            showGbFeedback("🎉 Your message is live on the wall!", "success");
          } else {
            showGbFeedback(data.error || "Something went wrong.", "error");
          }
        } catch (err) {
          console.error("Guestbook post error:", err);
          showGbFeedback("Error: " + err.message, "error");
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post to Guestbook'; }
        }
      });
    }

    loadGuestbook();

    // ===== DEVELOPER TERMINAL EASTER EGG =====
    const terminalTrigger = document.getElementById("terminalTrigger");
    const terminalTriggerBlogs = document.getElementById("terminalTriggerBlogs");
    const terminalModal = document.getElementById("terminalModal");
    const termClose = document.getElementById("termClose");
    const termInput = document.getElementById("termInput");
    const termOutput = document.getElementById("termOutput");
    const terminalBody = document.getElementById("terminalBody");

    const openTerminal = () => {
      if(terminalModal) {
        terminalModal.classList.add("active");
        setTimeout(() => termInput.focus(), 100);
      }
    };

    const stopMatrixEffect = () => {
      if (termOutput) termOutput.style.color = "";
      const mCanvas = document.getElementById("matrixCanvas");
      if (mCanvas) {
        clearInterval(window.matrixInterval);
        mCanvas.remove();
        if (terminalModal) {
          terminalModal.style.background = "";
          terminalModal.style.backdropFilter = "";
        }
      }
    };

    if (terminalTrigger) terminalTrigger.addEventListener("click", openTerminal);
    if (terminalTriggerBlogs) terminalTriggerBlogs.addEventListener("click", openTerminal);

    if (termClose) {
      termClose.addEventListener("click", () => {
        terminalModal.classList.remove("active");
        stopMatrixEffect();
      });
    }

    if (terminalModal) {
      terminalModal.addEventListener("click", (e) => {
        if(e.target === terminalModal) {
          terminalModal.classList.remove("active");
          stopMatrixEffect();
        }
      });
    }

    const printToTerminal = (html) => {
      const div = document.createElement("div");
      div.className = "term-line";
      div.innerHTML = html;
      termOutput.appendChild(div);
      terminalBody.scrollTop = terminalBody.scrollHeight;
    };

    const processCommand = (cmd) => {
      const args = cmd.toLowerCase().trim().split(/\s+/);
      const command = args[0];

      if (!command) return;

      // Print the prompt and command
      printToTerminal(`<span class="term-prompt">guest@tilak-portfolio:~$</span> ${cmd}`);

      switch (command) {
        case "help":
          printToTerminal(`Available commands:
            <br> <span class="term-highlight">Core:</span> help, whoami, about, education, skills, experience, projects
            <br> <span class="term-highlight">Contact:</span> contact, email, github, linkedin, location
            <br> <span class="term-highlight">Extras:</span> achievements, certifications, blog, hobbies, resume
            <br> <span class="term-highlight">System:</span> ls, cat, pwd, clear, neofetch, matrix, theme, exit`);
          break;
        case "whoami":
          printToTerminal(`Tilak BV. <br>CSE Student @ CBIT, Kolar. <br>Full Stack Developer & Data Scientist. <br>Building the future, one line at a time.`);
          break;
        case "about":
          printToTerminal(`I'm a Computer Science & Engineering student at CBIT, Kolar. I am deeply passionate about full-stack development, architecting AI systems, and leveraging data science to build clean, functional software.`);
          break;
        case "education":
          printToTerminal(`B.E. Computer Science and Engineering<br>C. Byregowda Institute of Technology (VTU), Kolar (2023-2027)`);
          break;
        case "skills":
          printToTerminal(`<span class="term-success">Python, Java, C, C++, PHP, HTML/CSS/JS, Flask, MySQL, Git/GitHub, Cloud Computing</span>`);
          break;
        case "experience":
          printToTerminal(`Data Science Internship @ Agratas Academy Pvt. Ltd.<br>Worked with real-world datasets, Python-based data manipulation, and structured dataset analytics.`);
          break;
        case "projects":
        case "ls":
          if (command === "ls" && args[1] && args[1] !== "projects" && args[1] !== "static") {
            printToTerminal(`ls: cannot access '${args[1]}': No such file or directory`);
          } else {
            printToTerminal(`drwxr-xr-x  <span class="term-highlight">Drowsiness_Detection_System</span>
drwxr-xr-x  <span class="term-highlight">Smart_Campus_Web_App</span>
drwxr-xr-x  <span class="term-highlight">Data_Science_Pipeline</span>
-rw-r--r--  skills.txt
-rw-r--r--  resume.pdf`);
          }
          break;
        case "contact":
          printToTerminal(`Email: tilakatilakachary@gmail.com<br>Phone: +91 93530 56798<br>Location: Chikkaballapur, India`);
          break;
        case "email":
          printToTerminal(`Opening mail client...`);
          setTimeout(() => window.location.href = "mailto:tilakatilakachary@gmail.com", 800);
          break;
        case "github":
          printToTerminal(`Opening GitHub profile... <a href="https://github.com/Tilak2005-BV" target="_blank" style="color:#58a6ff;">Click here if popup is blocked</a>`);
          setTimeout(() => window.open("https://github.com/Tilak2005-BV", "_blank"), 800);
          break;
        case "linkedin":
          printToTerminal(`Opening LinkedIn profile... <a href="https://www.linkedin.com/in/tilakachary-tilaka-b2412a321/" target="_blank" style="color:#58a6ff;">Click here if popup is blocked</a>`);
          setTimeout(() => window.open("https://www.linkedin.com/in/tilakachary-tilaka-b2412a321/", "_blank"), 800);
          break;
        case "location":
          printToTerminal(`Chikkaballapur, Karnataka, India`);
          break;
        case "achievements":
          printToTerminal(`- Hackathon Winner (3rd Place) - Technical Hackathon<br>- Hackathon Second Round - Quantum Quest 24 HR Hackathon`);
          break;
        case "certifications":
          printToTerminal(`- Certificate of Internship (Data Science)<br>- Certificate of Industrial Training<br>- Hackathon Participant & Winner Certificates`);
          break;
        case "blog":
          printToTerminal(`Redirecting to Blogs & Life...`);
          setTimeout(() => window.location.href = "/blogs", 800);
          break;
        case "hobbies":
          printToTerminal(`Participating in hackathons, exploring new AI frameworks, and solving complex problems.`);
          break;
        case "resume":
          printToTerminal(`Downloading resume.pdf...`);
          setTimeout(() => window.location.href = "/download-cv", 800);
          break;
        case "cat":
          if (args[1] === "skills.txt") printToTerminal(`<span class="term-success">Python, Java, C, C++, PHP, HTML/CSS/JS, Flask, MySQL, Git</span>`);
          else if (args[1] === "resume.pdf") {
            printToTerminal(`Downloading resume.pdf...`);
            setTimeout(() => window.location.href = "/download-cv", 800);
          }
          else printToTerminal(`cat: ${args[1] || ''}: No such file or directory`);
          break;
        case "pwd":
          printToTerminal(`/home/guest/portfolio`);
          break;
        case "clear":
          termOutput.innerHTML = "";
          break;
        case "neofetch":
          printToTerminal(`
<span style="color:#00ff00;">       /\\       </span>   <span class="term-highlight">guest</span>@<span class="term-highlight">tilak-portfolio</span>
<span style="color:#00ff00;">      /  \\      </span>   ---------------------
<span style="color:#00ff00;">     /____\\     </span>   <span class="term-success">OS</span>: Arch Linux x86_64
<span style="color:#00ff00;">    /      \\    </span>   <span class="term-success">Host</span>: Portfolio Server 1.0
<span style="color:#00ff00;">   /        \\   </span>   <span class="term-success">Uptime</span>: 42 days
<span style="color:#00ff00;">  /          \\  </span>   <span class="term-success">Shell</span>: zsh 5.8
          `);
          break;
        case "matrix":
          printToTerminal(`<span class="term-success">Wake up, Neo...<br>The Matrix has you...<br>Follow the white rabbit. (Type 'exit' to stop)</span>`);
          termOutput.style.color = "#00ff00";
          
          if (!document.getElementById("matrixCanvas")) {
            const mCanvas = document.createElement("canvas");
            mCanvas.id = "matrixCanvas";
            mCanvas.style.position = "fixed";
            mCanvas.style.top = "0";
            mCanvas.style.left = "0";
            mCanvas.style.width = "100vw";
            mCanvas.style.height = "100vh";
            mCanvas.style.zIndex = "9998"; // Just behind the terminal modal
            mCanvas.style.pointerEvents = "none";
            document.body.appendChild(mCanvas);
            
            // Remove modal backdrop so canvas is visible
            terminalModal.style.background = "transparent";
            terminalModal.style.backdropFilter = "none";
            
            const ctx = mCanvas.getContext("2d");
            mCanvas.width = window.innerWidth;
            mCanvas.height = window.innerHeight;
            
            // Initial black fill
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, mCanvas.width, mCanvas.height);
            
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*]*";
            const fontSize = 16;
            const columns = mCanvas.width / fontSize;
            const drops = [];
            for (let x = 0; x < columns; x++) drops[x] = 1;
            
            window.matrixInterval = setInterval(() => {
              ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
              ctx.fillRect(0, 0, mCanvas.width, mCanvas.height);
              ctx.fillStyle = "#0F0";
              ctx.font = fontSize + "px monospace";
              for (let i = 0; i < drops.length; i++) {
                const text = letters.charAt(Math.floor(Math.random() * letters.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > mCanvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
              }
            }, 33);
          }
          break;
        case "theme":
          printToTerminal(`Toggling theme...`);
          setTimeout(() => {
            const next = document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
            document.body.setAttribute("data-theme", next);
            localStorage.setItem("theme", next);
            if (document.getElementById("themeIcon")) {
              document.getElementById("themeIcon").className = next === "dark" ? "fas fa-sun" : "fas fa-moon";
            }
          }, 400);
          break;
        case "exit":
          terminalModal.classList.remove("active");
          stopMatrixEffect();
          break;
        default:
          printToTerminal(`<span class="term-error">Command not found:</span> ${command}. Type 'help' to see available commands.`);
      }
    };

    if (termInput) {
      termInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const cmd = termInput.value;
          termInput.value = "";
          processCommand(cmd);
        }
      });
      terminalBody.addEventListener("click", () => termInput.focus());
    }

});