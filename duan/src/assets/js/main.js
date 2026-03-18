document.addEventListener('DOMContentLoaded', function () {
  // Tabs lọc sản phẩm
  const tabs = document.querySelectorAll('#productTabs .nav-link');
  const products = document.querySelectorAll('.product');

  if (tabs.length && products.length) {
    tabs.forEach(tab => {
      tab.addEventListener('click', function () {
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        const filter = this.dataset.filter;
        products.forEach(product => {
          const category = product.getAttribute('data-category');
          product.style.display = (filter === 'all' || category === filter) ? 'block' : 'none';
        });
      });
    });
  }

  // Dark mode toggle
  const toggleBtn = document.getElementById('toggle-mode');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const icon = toggleBtn.querySelector('i');
      icon.classList.toggle('fa-moon');
      icon.classList.toggle('fa-sun');
    });
  }

  // Chuyển tab chức năng
  const navItems = document.querySelectorAll('.sidebar nav li');
  const tabSections = document.querySelectorAll('main .tab');
  navItems.forEach(li => {
    li.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      li.classList.add('active');

      const tab = li.getAttribute('data-tab');
      tabSections.forEach(sec => sec.classList.remove('active'));
      const target = document.getElementById(tab);
      if (target) target.classList.add('active');
    });
  });

  // Thay đổi ảnh đại diện
  const avatarInput = document.getElementById('avatar-input');
  const avatarPreview = document.getElementById('preview-avatar');
  if (avatarInput && avatarPreview) {
    avatarInput.addEventListener('change', function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          avatarPreview.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Submit thông tin cá nhân
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      alert("Thông tin cá nhân đã được lưu thành công!");
    });
  }
});
