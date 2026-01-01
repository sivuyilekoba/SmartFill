// Data generator utility - generates random data based on field type

const DataGenerator = {
  // Generate random email
  generateEmail: function() {
    const randomString = Math.random().toString(36).substring(2, 10);
    const domains = ['example.com', 'test.com', 'demo.com', 'sample.org'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${randomString}@${domain}`;
  },

  // Generate random phone number
  generatePhone: function() {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const subscriber = Math.floor(Math.random() * 9000) + 1000;
    return `(${areaCode}) ${exchange}-${subscriber}`;
  },

  // Generate random text
  generateText: function(maxLength = 12) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const length = Math.floor(Math.random() * maxLength) + 5;
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate random number
  generateNumber: function(min = 1, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Generate random date (within last year)
  generateDate: function(format = 'yyyy-mm-dd') {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const randomDate = new Date(oneYearAgo.getTime() + Math.random() * (today.getTime() - oneYearAgo.getTime()));
    
    const yyyy = randomDate.getFullYear();
    const mm = String(randomDate.getMonth() + 1).padStart(2, '0');
    const dd = String(randomDate.getDate()).padStart(2, '0');
    
    if (format === 'mm/dd/yyyy') {
      return `${mm}/${dd}/${yyyy}`;
    } else if (format === 'dd/mm/yyyy') {
      return `${dd}/${mm}/${yyyy}`;
    }
    return `${yyyy}-${mm}-${dd}`;
  },

  // Generate random URL
  generateUrl: function() {
    const protocols = ['https://', 'http://'];
    const domains = ['example.com', 'test.org', 'demo.io', 'sample.net'];
    const paths = ['home', 'page', 'profile', 'account'];
    
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const path = paths[Math.floor(Math.random() * paths.length)];
    
    return `${protocol}${domain}/${path}`;
  },

  // Generate random name
  generateName: function() {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Olivia', 'Robert', 'Sophia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  },

  // Infer field type from element and generate appropriate data
  generateForField: function(field) {
    const fieldType = (field.type || '').toLowerCase();
    const fieldName = (field.name || field.id || '').toLowerCase();
    const placeholder = (field.placeholder || '').toLowerCase();
    const label = this.getAssociatedLabel(field).toLowerCase();
    
    const combinedHint = `${fieldType} ${fieldName} ${placeholder} ${label}`;

    // Email detection
    if (fieldType === 'email' || combinedHint.includes('email')) {
      return this.generateEmail();
    }

    // Phone detection
    if (fieldType === 'tel' || combinedHint.includes('phone') || combinedHint.includes('telephone')) {
      return this.generatePhone();
    }

    // URL detection
    if (fieldType === 'url' || combinedHint.includes('website') || combinedHint.includes('url')) {
      return this.generateUrl();
    }

    // Number detection
    if (fieldType === 'number') {
      return String(this.generateNumber(1, 100));
    }

    // Date detection
    if (fieldType === 'date') {
      return this.generateDate('yyyy-mm-dd');
    }

    // Month detection
    if (fieldType === 'month') {
      const date = this.generateDate('yyyy-mm-dd');
      return date.substring(0, 7);
    }

    // Password detection
    if (fieldType === 'password') {
      return this.generateText(16);
    }

    // Name detection
    if (combinedHint.includes('name') && !combinedHint.includes('username')) {
      return this.generateName();
    }

    // Username/login detection
    if (combinedHint.includes('username') || combinedHint.includes('login') || combinedHint.includes('user')) {
      return this.generateText(10);
    }

    // Textarea or generic text input
    if (field.tagName === 'TEXTAREA' || fieldType === 'text' || fieldType === '') {
      return this.generateText(15);
    }

    // Default: return generic text
    return this.generateText(12);
  },

  // Helper: Get associated label text for a form field
  getAssociatedLabel: function(field) {
    // Check if field has id and find associated label
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) {
        return label.textContent;
      }
    }

    // Check if label is parent or sibling
    let parent = field.parentElement;
    if (parent && parent.tagName === 'LABEL') {
      return parent.textContent;
    }

    // Check previous sibling
    if (field.previousElementSibling && field.previousElementSibling.tagName === 'LABEL') {
      return field.previousElementSibling.textContent;
    }

    return '';
  }
};
