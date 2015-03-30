// ==========================================================================
// Project:   Ember Validations
// Copyright: Copyright 2013 DockYard, LLC. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================


minispade.register('ember-validations/core', "(function() {Ember.Validations = Ember.Namespace.create({\n  VERSION: '1.0.0'\n});\n\n})();\n//@ sourceURL=ember-validations/core");minispade.register('ember-validations/defaultMessages', "(function() {Ember.Validations.messages = {\n  render: function(attribute, context) {\n    if (Ember.I18n) {\n      return Ember.I18n.t('errors.' + attribute, context);\n    } else {\n      var regex = new RegExp(\"{{(.*?)}}\"),\n          attributeName = \"\";\n      if (regex.test(this.defaults[attribute])) {\n        attributeName = regex.exec(this.defaults[attribute])[1];\n      }\n      return this.defaults[attribute].replace(regex, context[attributeName]);\n    }\n  },\n  defaults: {\n    inclusion: \"is not included in the list\",\n    exclusion: \"is reserved\",\n    invalid: \"is invalid\",\n    confirmation: \"doesn't match {{attribute}}\",\n    accepted: \"must be accepted\",\n    empty: \"can't be empty\",\n    blank: \"can't be blank\",\n    present: \"must be blank\",\n    tooLong: \"is too long (maximum is {{count}} characters)\",\n    tooShort: \"is too short (minimum is {{count}} characters)\",\n    wrongLength: \"is the wrong length (should be {{count}} characters)\",\n    notANumber: \"is not a number\",\n    notAnInteger: \"must be an integer\",\n    greaterThan: \"must be greater than {{count}}\",\n    greaterThanOrEqualTo: \"must be greater than or equal to {{count}}\",\n    equalTo: \"must be equal to {{count}}\",\n    lessThan: \"must be less than {{count}}\",\n    lessThanOrEqualTo: \"must be less than or equal to {{count}}\",\n    otherThan: \"must be other than {{count}}\",\n    odd: \"must be odd\",\n    even: \"must be even\",\n    url: \"is not a valid URL\"\n  }\n};\n\n})();\n//@ sourceURL=ember-validations/defaultMessages");minispade.register('ember-validations/errors', "(function() {Ember.Validations.Errors = Ember.Object.extend({\n  unknownProperty: function(property) {\n    this.set(property, Ember.makeArray());\n    return this.get(property);\n  }\n});\n\n})();\n//@ sourceURL=ember-validations/errors");minispade.register('ember-validations', "(function() {minispade.require('ember-validations/core');\nminispade.require('ember-validations/defaultMessages');\nminispade.require('ember-validations/errors');\nminispade.require('ember-validations/mixin');\nminispade.require('ember-validations/patterns');\nminispade.require('ember-validations/validators');\n\n})();\n//@ sourceURL=ember-validations");minispade.register('ember-validations/mixin', "(function() {var setValidityMixin = Ember.Mixin.create({\n  isValid: function() {\n    return this.get('validators').compact().filterBy('isValid', false).get('length') === 0;\n  }.property('validators.@each.isValid'),\n  isInvalid: Ember.computed.not('isValid')\n});\n\nvar pushValidatableObject = function(model, property) {\n  var content = model.get(property);\n\n  model.removeObserver(property, pushValidatableObject);\n  if (Ember.isArray(content)) {\n    model.validators.pushObject(ArrayValidatorProxy.create({model: model, property: property, contentBinding: 'model.' + property}));\n  } else {\n    model.validators.pushObject(content);\n  }\n};\n\nvar findValidator = function(validator) {\n  var klass = validator.classify();\n  return Ember.Validations.validators.local[klass] || Ember.Validations.validators.remote[klass];\n};\n\nvar ArrayValidatorProxy = Ember.ArrayProxy.extend(setValidityMixin, {\n  validate: function() {\n    return this._validate();\n  },\n  _validate: function() {\n    var promises = this.get('content').invoke('_validate').without(undefined);\n    return Ember.RSVP.all(promises);\n  }.on('init'),\n  validators: Ember.computed.alias('content')\n});\n\nEmber.Validations.Mixin = Ember.Mixin.create(setValidityMixin, {\n  init: function() {\n    this._super();\n    this.errors = Ember.Validations.Errors.create();\n    this._dependentValidationKeys = {};\n    this.validators = Ember.makeArray();\n    if (this.get('validations') === undefined) {\n      this.validations = {};\n    }\n    this.buildValidators();\n    this.validators.forEach(function(validator) {\n      validator.addObserver('errors.[]', this, function(sender, key, value, context, rev) {\n        var errors = Ember.makeArray();\n        this.validators.forEach(function(validator) {\n          if (validator.property === sender.property) {\n            errors = errors.concat(validator.errors);\n          }\n        }, this);\n        this.set('errors.' + sender.property, errors);\n      });\n    }, this);\n  },\n  buildValidators: function() {\n    var property, validator;\n\n    for (property in this.validations) {\n      if (this.validations[property].constructor === Object) {\n        this.buildRuleValidator(property);\n      } else {\n        this.buildObjectValidator(property);\n      }\n    }\n  },\n  buildRuleValidator: function(property) {\n    var validator;\n    for (validator in this.validations[property]) {\n      if (this.validations[property].hasOwnProperty(validator)) {\n        this.validators.pushObject(findValidator(validator).create({model: this, property: property, options: this.validations[property][validator]}));\n      }\n    }\n  },\n  buildObjectValidator: function(property) {\n    if (Ember.isNone(this.get(property))) {\n      this.addObserver(property, this, pushValidatableObject);\n    } else {\n      pushValidatableObject(this, property);\n    }\n  },\n  validate: function() {\n    var self = this;\n    return this._validate().then(function(vals) {\n      var errors = self.get('errors');\n      if (vals.contains(false)) {\n        return Ember.RSVP.reject(errors);\n      }\n      return errors;\n    });\n  },\n  _validate: function() {\n    var promises = this.validators.invoke('_validate').without(undefined);\n    return Ember.RSVP.all(promises);\n  }.on('init')\n});\n\n})();\n//@ sourceURL=ember-validations/mixin");minispade.register('ember-validations/patterns', "(function() {Ember.Validations.patterns = Ember.Namespace.create({\n  numericality: /^(-|\\+)?(?:\\d+|\\d{1,3}(?:,\\d{3})+)(?:\\.\\d*)?$/,\n  blank: /^\\s*$/\n});\n\n})();\n//@ sourceURL=ember-validations/patterns");minispade.register('ember-validations/validatorNamespaces', "(function() {Ember.Validations.validators        = Ember.Namespace.create();\nEmber.Validations.validators.local  = Ember.Namespace.create();\nEmber.Validations.validators.remote = Ember.Namespace.create();\n\n})();\n//@ sourceURL=ember-validations/validatorNamespaces");minispade.register('ember-validations/validators', "(function() {minispade.require('ember-validations/validatorNamespaces');\nminispade.require('ember-validations/validators/base');\nminispade.require('ember-validations/validators/absence');\nminispade.require('ember-validations/validators/acceptance');\nminispade.require('ember-validations/validators/confirmation');\nminispade.require('ember-validations/validators/exclusion');\nminispade.require('ember-validations/validators/format');\nminispade.require('ember-validations/validators/inclusion');\nminispade.require('ember-validations/validators/length');\nminispade.require('ember-validations/validators/numericality');\nminispade.require('ember-validations/validators/presence');\nminispade.require('ember-validations/validators/url');\n\n})();\n//@ sourceURL=ember-validations/validators");minispade.register('ember-validations/validators/absence', "(function() {Ember.Validations.validators.local.Absence = Ember.Validations.validators.Base.extend({\n  init: function() {\n    this._super();\n    /*jshint expr:true*/\n    if (this.options === true) {\n      this.set('options', {});\n    }\n\n    if (this.options.message === undefined) {\n      this.set('options.message', Ember.Validations.messages.render('present', this.options));\n    }\n  },\n  call: function() {\n    if (!Ember.isEmpty(this.model.get(this.property))) {\n      this.errors.pushObject(this.options.message);\n    }\n  }\n});\n\n})();\n//@ sourceURL=ember-validations/validators/absence");minispade.register('ember-validations/validators/acceptance', "(function() {Ember.Validations.validators.local.Acceptance = Ember.Validations.validators.Base.extend({\n  init: function() {\n    this._super();\n    /*jshint expr:true*/\n    if (this.options === true) {\n      this.set('options', {});\n    }\n\n    if (this.options.message === undefined) {\n      this.set('options.message', Ember.Validations.messages.render('accepted', this.options));\n    }\n  },\n  call: function() {\n    if (this.options.accept) {\n      if (this.model.get(this.property) !== this.options.accept) {\n        this.errors.pushObject(this.options.message);\n      }\n    } else if (this.model.get(this.property) !== '1' && this.model.get(this.property) !== 1 && this.model.get(this.property) !== true) {\n      this.errors.pushObject(this.options.message);\n    }\n  }\n});\n\n})();\n//@ sourceURL=ember-validations/validators/acceptance");minispade.register('ember-validations/validators/base', "(function() {Ember.Validations.validators.Base = Ember.Object.extend({\n  init: function() {\n    this.set('errors', Ember.makeArray());\n    this._dependentValidationKeys = Ember.makeArray();\n    this.conditionals = {\n      'if': this.get('options.if'),\n      unless: this.get('options.unless')\n    };\n    this.model.addObserver(this.property, this, this._validate);\n  },\n  addObserversForDependentValidationKeys: function() {\n    this._dependentValidationKeys.forEach(function(key) {\n      this.model.addObserver(key, this, this._validate);\n    }, this);\n  }.on('init'),\n  pushDependentValidationKeyToModel: function() {\n    var model = this.get('model');\n    if (model._dependentValidationKeys[this.property] === undefined) {\n      model._dependentValidationKeys[this.property] = Ember.makeArray();\n    }\n    model._dependentValidationKeys[this.property].addObjects(this._dependentValidationKeys);\n  }.on('init'),\n  call: function () {\n    throw 'Not implemented!';\n  },\n  unknownProperty: function(key) {\n    var model = this.get('model');\n    if (model) {\n      return model.get(key);\n    }\n  },\n  isValid: Ember.computed.empty('errors.[]'),\n  validate: function() {\n    var self = this;\n    return this._validate().then(function(success) {\n      // Convert validation failures to rejects.\n      var errors = self.get('model.errors');\n      if (success) {\n        return errors;\n      } else {\n        return Ember.RSVP.reject(errors);\n      }\n    });\n  },\n  _validate: function() {\n    this.errors.clear();\n    if (this.canValidate()) {\n      this.call();\n    }\n    if (this.get('isValid')) {\n      return Ember.RSVP.resolve(true);\n    } else {\n      return Ember.RSVP.resolve(false);\n    }\n  }.on('init'),\n  canValidate: function() {\n    if (typeof(this.conditionals) === 'object') {\n      if (this.conditionals['if']) {\n        if (typeof(this.conditionals['if']) === 'function') {\n          return this.conditionals['if'](this.model, this.property);\n        } else if (typeof(this.conditionals['if']) === 'string') {\n          if (typeof(this.model[this.conditionals['if']]) === 'function') {\n            return this.model[this.conditionals['if']]();\n          } else {\n            return this.model.get(this.conditionals['if']);\n          }\n        }\n      } else if (this.conditionals.unless) {\n        if (typeof(this.conditionals.unless) === 'function') {\n          return !this.conditionals.unless(this.model, this.property);\n        } else if (typeof(this.conditionals.unless) === 'string') {\n          if (typeof(this.model[this.conditionals.unless]) === 'function') {\n            return !this.model[this.conditionals.unless]();\n          } else {\n            return !this.model.get(this.conditionals.unless);\n          }\n        }\n      } else {\n        return true;\n      }\n    } else {\n      return true;\n    }\n  }\n});\n\n})();\n//@ sourceURL=ember-validations/validators/base");minispade.register('ember-validations/validators/confirmation', "(function() {Ember.Validations.validators.local.Confirmation = Ember.Validations.validators.Base.extend({\n  init: function() {\n    this.originalProperty = this.property;\n    this.property = this.property + 'Confirmation';\n    this._super();\n    this._dependentValidationKeys.pushObject(this.originalProperty);\n    /*jshint expr:true*/\n    if (this.options === true) {\n      this.set('options', { attribute: this.originalProperty });\n      this.set('options', { message: Ember.Validations.messages.render('confirmation', this.options) });\n    }\n  },\n  call: function() {\n    if (this.model.get(this.originalProperty) !== this.model.get(this.property)) {\n      this.errors.pushObject(this.options.message);\n    }\n  }\n});\n\n})();\n//@ sourceURL=ember-validations/validators/confirmation");minispade.register('ember-validations/validators/exclusion', "(function() {Ember.Validations.validators.local.Exclusion = Ember.Validations.validators.Base.extend({\n  init: function() {\n    this._super();\n    if (this.options.constructor === Array) {\n      this.set('options', { 'in': this.options });\n    }\n\n    if (this.options.message === undefined) {\n      this.set('options.message', Ember.Validations.messages.render('exclusion', this.options));\n    }\n  },\n  call: function() {\n    /*jshint expr:true*/\n    var message, lower, upper;\n\n    if (Ember.isEmpty(this.model.get(this.property))) {\n      if (this.options.allowBlank === undefined) {\n        this.errors.pushObject(this.options.message);\n      }\n    } else if (this.options['in']) {\n      if (Ember.$.inArray(this.model.get(this.property), this.options['in']) !== -1) {\n        this.errors.pushObject(this.options.message);\n      }\n    } else if (this.options.range) {\n      lower = this.options.range[0];\n      upper = this.options.range[1];\n\n      if (this.model.get(this.property) >= lower && this.model.get(this.property) <= upper) {\n        this.errors.pushObject(this.options.message);\n      }\n    }\n  }\n});\n\n})();\n//@ sourceURL=ember-validations/validators/exclusion");minispade.register('ember-validations/validators/format', "(function() {Ember.Validations.validators.local.Format = Ember.Validations.validators.Base.extend({\n  init: function() {\n    this._super();\n    if (this.options.constructor === RegExp) {\n      this.set('options', { 'with': this.options });\n    }\n\n    if (this.options.message === undefined) {\n      this.set('options.message',  Ember.Validations.messages.render('invalid', this.options));\n    }\n   },\n   call: function() {\n    if (Ember.isEmpty(this.model.get(this.property))) {\n      if (this.options.allowBlank === undefined) {\n        this.errors.pushObject(this.options.message);\n      }\n    } else if (this.options['with'] && !this.options['with'].test(this.model.get(this.property))) {\n      this.errors.pushObject(this.options.message);\n    } else if (this.options.without && this.options.without.test(this.model.get(this.property))) {\n      this.errors.pushObject(this.options.message);\n    }\n  }\n});\n\n})();\n//@ sourceURL=ember-validations/validators/format");minispade.register('ember-validations/validators/inclusion', "(function() {Ember.Validations.validators.local.Inclusion = Ember.Validations.validators.Base.extend({\n  init: function() {\n    this._super();\n    if (this.options.constructor === Array) {\n      this.set('options', { 'in': this.options });\n    }\n\n    if (this.options.message === undefined) {\n      this.set('options.message', Ember.Validations.messages.render('inclusion', this.options));\n    }\n  },\n  call: function() {\n    var message, lower, upper;\n    if (Ember.isEmpty(this.model.get(this.property))) {\n      if (this.options.allowBlank === undefined) {\n        this.errors.pushObject(this.options.message);\n      }\n    } else if (this.options['in']) {\n      if (Ember.$.inArray(this.model.get(this.property), this.options['in']) === -1) {\n        this.errors.pushObject(this.options.message);\n      }\n    } else if (this.options.range) {\n      lower = this.options.range[0];\n      upper = this.options.range[1];\n\n      if (this.model.get(this.property) < lower || this.model.get(this.property) > upper) {\n        this.errors.pushObject(this.options.message);\n      }\n    }\n  }\n});\n\n})();\n//@ sourceURL=ember-validations/validators/inclusion");minispade.register('ember-validations/validators/length', "(function() {Ember.Validations.validators.local.Length = Ember.Validations.validators.Base.extend({\n  init: function() {\n    var index, key;\n    this._super();\n    /*jshint expr:true*/\n    if (typeof(this.options) === 'number') {\n      this.set('options', { 'is': this.options });\n    }\n\n    if (this.options.messages === undefined) {\n      this.set('options.messages', {});\n    }\n\n    for (index = 0; index < this.messageKeys().length; index++) {\n      key = this.messageKeys()[index];\n      if (this.options[key] !== undefined && this.options[key].constructor === String) {\n        this.model.addObserver(this.options[key], this, this._validate);\n      }\n    }\n\n    this.options.tokenizer = this.options.tokenizer || function(value) { return value.split(''); };\n    // if (typeof(this.options.tokenizer) === 'function') {\n      // debugger;\n      // // this.tokenizedLength = new Function('value', 'return '\n    // } else {\n      // this.tokenizedLength = new Function('value', 'return (value || \"\").' + (this.options.tokenizer || 'split(\"\")') + '.length');\n    // }\n  },\n  CHECKS: {\n    'is'      : '==',\n    'minimum' : '>=',\n    'maximum' : '<='\n  },\n  MESSAGES: {\n    'is'      : 'wrongLength',\n    'minimum' : 'tooShort',\n    'maximum' : 'tooLong'\n  },\n  getValue: function(key) {\n    if (this.options[key].constructor === String) {\n      return this.model.get(this.options[key]) || 0;\n    } else {\n      return this.options[key];\n    }\n  },\n  messageKeys: function() {\n    return Ember.keys(this.MESSAGES);\n  },\n  checkKeys: function() {\n    return Ember.keys(this.CHECKS);\n  },\n  renderMessageFor: function(key) {\n    var options = {count: this.getValue(key)}, _key;\n    for (_key in this.options) {\n      options[_key] = this.options[_key];\n    }\n\n    return this.options.messages[this.MESSAGES[key]] || Ember.Validations.messages.render(this.MESSAGES[key], options);\n  },\n  renderBlankMessage: function() {\n    if (this.options.is) {\n      return this.renderMessageFor('is');\n    } else if (this.options.minimum) {\n      return this.renderMessageFor('minimum');\n    }\n  },\n  call: function() {\n    var check, fn, message, operator, key;\n\n    if (Ember.isEmpty(this.model.get(this.property))) {\n      if (this.options.allowBlank === undefined && (this.options.is || this.options.minimum)) {\n        this.errors.pushObject(this.renderBlankMessage());\n      }\n    } else {\n      for (key in this.CHECKS) {\n        operator = this.CHECKS[key];\n        if (!this.options[key]) {\n          continue;\n        }\n\n        fn = new Function('return ' + this.options.tokenizer(this.model.get(this.property)).length + ' ' + operator + ' ' + this.getValue(key));\n        if (!fn()) {\n          this.errors.pushObject(this.renderMessageFor(key));\n        }\n      }\n    }\n  }\n});\n\n})();\n//@ sourceURL=ember-validations/validators/length");minispade.register('ember-validations/validators/numericality', "(function() {Ember.Validations.validators.local.Numericality = Ember.Validations.validators.Base.extend({\n  init: function() {\n    /*jshint expr:true*/\n    var index, keys, key;\n    this._super();\n\n    if (this.options === true) {\n      this.options = {};\n    } else if (this.options.constructor === String) {\n      key = this.options;\n      this.options = {};\n      this.options[key] = true;\n    }\n\n    if (this.options.messages === undefined || this.options.messages.numericality === undefined) {\n      this.options.messages = this.options.messages || {};\n      this.options.messages = { numericality: Ember.Validations.messages.render('notANumber', this.options) };\n    }\n\n    if (this.options.onlyInteger !== undefined && this.options.messages.onlyInteger === undefined) {\n      this.options.messages.onlyInteger = Ember.Validations.messages.render('notAnInteger', this.options);\n    }\n\n    keys = Ember.keys(this.CHECKS).concat(['odd', 'even']);\n    for(index = 0; index < keys.length; index++) {\n      key = keys[index];\n\n      var prop = this.options[key];\n      if (key in this.options && isNaN(prop)) {\n        this.model.addObserver(prop, this, this._validate);\n      }\n\n      if (prop !== undefined && this.options.messages[key] === undefined) {\n        if (Ember.$.inArray(key, Ember.keys(this.CHECKS)) !== -1) {\n          this.options.count = prop;\n        }\n        this.options.messages[key] = Ember.Validations.messages.render(key, this.options);\n        if (this.options.count !== undefined) {\n          delete this.options.count;\n        }\n      }\n    }\n  },\n  CHECKS: {\n    equalTo              :'===',\n    greaterThan          : '>',\n    greaterThanOrEqualTo : '>=',\n    lessThan             : '<',\n    lessThanOrEqualTo    : '<='\n  },\n  call: function() {\n    var check, checkValue, fn, form, operator, val;\n\n    if (Ember.isEmpty(this.model.get(this.property))) {\n      if (this.options.allowBlank === undefined) {\n        this.errors.pushObject(this.options.messages.numericality);\n      }\n    } else if (!Ember.Validations.patterns.numericality.test(this.model.get(this.property))) {\n      this.errors.pushObject(this.options.messages.numericality);\n    } else if (this.options.onlyInteger === true && !(/^[+\\-]?\\d+$/.test(this.model.get(this.property)))) {\n      this.errors.pushObject(this.options.messages.onlyInteger);\n    } else if (this.options.odd  && parseInt(this.model.get(this.property), 10) % 2 === 0) {\n      this.errors.pushObject(this.options.messages.odd);\n    } else if (this.options.even && parseInt(this.model.get(this.property), 10) % 2 !== 0) {\n      this.errors.pushObject(this.options.messages.even);\n    } else {\n      for (check in this.CHECKS) {\n        operator = this.CHECKS[check];\n\n        if (this.options[check] === undefined) {\n          continue;\n        }\n\n        if (!isNaN(parseFloat(this.options[check])) && isFinite(this.options[check])) {\n          checkValue = this.options[check];\n        } else if (this.model.get(this.options[check]) !== undefined) {\n          checkValue = this.model.get(this.options[check]);\n        }\n\n        fn = new Function('return ' + this.model.get(this.property) + ' ' + operator + ' ' + checkValue);\n\n        if (!fn()) {\n          this.errors.pushObject(this.options.messages[check]);\n        }\n      }\n    }\n  }\n});\n\n})();\n//@ sourceURL=ember-validations/validators/numericality");minispade.register('ember-validations/validators/presence', "(function() {Ember.Validations.validators.local.Presence = Ember.Validations.validators.Base.extend({\n  init: function() {\n    this._super();\n    /*jshint expr:true*/\n    if (this.options === true) {\n      this.options = {};\n    }\n\n    if (this.options.message === undefined) {\n      this.options.message = Ember.Validations.messages.render('blank', this.options);\n    }\n  },\n  call: function() {\n    if (Ember.isEmpty(this.model.get(this.property))) {\n      this.errors.pushObject(this.options.message);\n    }\n  }\n});\n\n})();\n//@ sourceURL=ember-validations/validators/presence");minispade.register('ember-validations/validators/url', "(function() {Ember.Validations.validators.local.Url = Ember.Validations.validators.Base.extend({\n  regexp: null,\n  regexp_ip: null,\n\n  init: function() {\n    this._super();\n\n    if (this.get('options.message') === undefined) {\n      this.set('options.message', Ember.Validations.messages.render('url', this.options));\n    }\n\n    if (this.get('options.protocols') === undefined) {\n      this.set('options.protocols', ['http', 'https']);\n    }\n\n    // Regular Expression Parts\n    var dec_octet = '(25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])'; // 0-255\n    var ipaddress = '(' + dec_octet + '(\\\\.' + dec_octet + '){3})';\n    var hostname = '([a-zA-Z0-9\\\\-]+\\\\.)+([a-zA-Z]{2,})';\n    var encoded = '%[0-9a-fA-F]{2}';\n    var characters = 'a-zA-Z0-9$\\\\-_.+!*\\'(),;:@&=';\n    var segment = '([' + characters + ']|' + encoded + ')*';\n\n    // Build Regular Expression\n    var regex_str = '^';\n\n    if (this.get('options.domainOnly') === true) {\n      regex_str += hostname;\n    } else {\n      regex_str += '(' + this.get('options.protocols').join('|') + '):\\\\/\\\\/'; // Protocol\n\n      // Username and password\n      if (this.get('options.allowUserPass') === true) {\n        regex_str += '(([a-zA-Z0-9$\\\\-_.+!*\\'(),;:&=]|' + encoded + ')+@)?'; // Username & passwords\n      }\n\n      // IP Addresses?\n      if (this.get('options.allowIp') === true) {\n        regex_str += '(' + hostname + '|' + ipaddress + ')'; // Hostname OR IP\n      } else {\n        regex_str += '(' + hostname + ')'; // Hostname only\n      }\n\n      // Ports\n      if (this.get('options.allowPort') === true) {\n        regex_str += '(:[0-9]+)?'; // Port\n      }\n\n      regex_str += '(\\\\/';\n      regex_str += '(' + segment + '(\\\\/' + segment + ')*)?'; // Path\n      regex_str += '(\\\\?' + '([' + characters + '/?]|' + encoded + ')*)?'; // Query\n      regex_str += '(\\\\#' + '([' + characters + '/?]|' + encoded + ')*)?'; // Anchor\n      regex_str += ')?';\n    }\n\n    regex_str += '$';\n\n    // RegExp\n    this.regexp = new RegExp(regex_str);\n    this.regexp_ip = new RegExp(ipaddress);\n  },\n  call: function() {\n    var url = this.model.get(this.property);\n\n    if (Ember.isEmpty(url)) {\n      if (this.get('options.allowBlank') !== true) {\n        this.errors.pushObject(this.get('options.message'));\n      }\n    } else {\n      if (this.get('options.allowIp') !== true) {\n        if (this.regexp_ip.test(url)) {\n          this.errors.pushObject(this.get('options.message'));\n          return;\n        }\n      }\n\n      if (!this.regexp.test(url)) {\n        this.errors.pushObject(this.get('options.message'));\n      }\n    }\n  }\n});\n\n\n})();\n//@ sourceURL=ember-validations/validators/url");