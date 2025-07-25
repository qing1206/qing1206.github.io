document.addEventListener('DOMContentLoaded', function() {
  // 获取所有记录元素
  const records = document.querySelectorAll('.bliss-record');
  
  // 添加点击事件，展开/收起详细信息
  records.forEach(record => {
    record.addEventListener('click', function() {
      this.classList.toggle('expanded');
    });
  });
  
  // 初始化筛选功能
  initFilters();
  
  // 初始化日历视图切换
  initViewToggle();
});

// 初始化筛选功能
function initFilters() {
  const filterTypes = document.querySelectorAll('.filter-type button');
  const filterPositions = document.querySelectorAll('.filter-position button');
  const records = document.querySelectorAll('.bliss-record');
  
  // 类型筛选
  filterTypes.forEach(button => {
    button.addEventListener('click', function() {
      const type = this.getAttribute('data-type');
      
      // 切换按钮状态
      filterTypes.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      if (type === 'all') {
        records.forEach(record => {
          record.style.display = '';
        });
      } else {
        records.forEach(record => {
          if (record.getAttribute('data-type') === type) {
            record.style.display = '';
          } else {
            record.style.display = 'none';
          }
        });
      }
    });
  });
  
  // 姿势筛选
  filterPositions.forEach(button => {
    button.addEventListener('click', function() {
      const position = this.getAttribute('data-position');
      
      // 切换按钮状态
      filterPositions.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      if (position === 'all') {
        records.forEach(record => {
          record.style.display = '';
        });
      } else {
        records.forEach(record => {
          if (record.getAttribute('data-position') === position) {
            record.style.display = '';
          } else {
            record.style.display = 'none';
          }
        });
      }
    });
  });
}

// 初始化视图切换
function initViewToggle() {
  const viewButtons = document.querySelectorAll('.view-toggle button');
  const blissContainer = document.querySelector('.bliss-container');
  
  viewButtons.forEach(button => {
    button.addEventListener('click', function() {
      const view = this.getAttribute('data-view');
      
      // 切换按钮状态
      viewButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // 移除所有视图类
      blissContainer.classList.remove('timeline-view', 'calendar-view', 'grid-view');
      
      // 添加当前视图类
      blissContainer.classList.add(`${view}-view`);
    });
  });
}