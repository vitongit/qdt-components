/* eslint-disable camelcase,prefer-arrow-callback,no-plusplus,comma-dangle,no-loop-func,no-undef */
const loadCapabilityApis = async (config) => {
  try {
    const capabilityApisCSS = document.createElement('link');
    const prefix = (config.prefix !== '') ? `/${config.prefix}` : '';
    const ticket = (config.ticket !== '' && config.ticket !== undefined) ? `?qlikTicket=${config.ticket}` : '';
    capabilityApisCSS.href = `${(config.secure ? 'https://' : 'http://') + config.host + (config.port ? `:${config.port}` : '') + prefix}/resources/autogenerated/qlik-styles.css${ticket}`;
    capabilityApisCSS.type = 'text/css';
    capabilityApisCSS.rel = 'stylesheet';
    document.head.appendChild(capabilityApisCSS);
    capabilityApisCSS.loaded = new Promise((resolve) => {
      capabilityApisCSS.onload = () => { resolve(); };
    });
    const capabilityApisJS = document.createElement('script');
    capabilityApisJS.src = `${(config.secure ? 'https://' : 'http://') + config.host + (config.port ? `:${config.port}` : '') + prefix}/resources/assets/external/requirejs/require.js`;
    setTimeout(() => { document.head.appendChild(capabilityApisJS); }, 1000);
    capabilityApisJS.loaded = new Promise((resolve) => {
      capabilityApisJS.onload = () => { resolve(); };
    });
    await Promise.all([capabilityApisJS.loaded, capabilityApisCSS.loaded]);
  } catch (error) {
    throw new Error(error);
  }
};

const fields = ['Год', 'Месяц', 'Год - Неделя', 'Неделя'];

const qApp = async (config) => {
  try {
    await loadCapabilityApis(config);
    const prefix = (config.prefix !== '') ? `/${config.prefix}/` : '/';
    window.require.config({
      baseUrl: `${(config.secure ? 'https://' : 'http://') + config.host + (config.port ? `:${config.port}` : '') + prefix}resources`,
      paths: {
        qlik: `${(config.secure ? 'https://' : 'http://') + config.host + (config.port ? `:${config.port}` : '') + prefix}resources/js/qlik`,
      },
    });
    return new Promise((resolve) => {
      window.require(['js/qlik'], (qlik) => {
        const app = qlik.openApp(config.appId, { ...config, isSecure: config.secure, prefix });
        console.log('app:', app.id);

        app.getList('SelectionObject', function () {
          for (let i = 0; i < fields.length; i++) {
            console.log('field:', fields[i]);
            app.createList({
              qDef: {
                qFieldDefs: [fields[i]] // set fieldname
              },
              qAutoSortByState: {
                qDisplayNumberOfRows: 1
              },
              qInitialDataFetch: [{
                qHeight: 1000, // can set number of rows returned
                qWidth: 1
              }]
            }, function (reply) {
              // console.log('reply:', reply.qListObject, 'app:', app.id);
              let rows = [];
              if (reply.qListObject.qDataPages.length > 0) {
                console.log('reply:', JSON.stringify(reply.qListObject.qDataPages[0].qMatrix), 'app:', app.id);
                rows = _.flatten(reply.qListObject.qDataPages[0].qMatrix);
              }
              const selected = rows.filter(function (row) {
                return row.qState === 'S';
              });
              const values = [];
              for (let j = 0; j < selected.length; j++) {
                values.push(selected[j].qText);
              }

              // localStorage.setItem(reply.qListObject.qDimensionInfo.qFallbackTitle, JSON.stringify(values));
              const fieldName = reply.qListObject.qDimensionInfo.qFallbackTitle;
              console.log('fieldName =', fieldName);
              console.log('localStorage =', localStorage.getItem(fieldName), 'equal to empty', localStorage.getItem(fieldName) === '', 'to null', localStorage.getItem(fieldName) === null, 'to undefined', localStorage.getItem(fieldName) === undefined);
              const valuesLS = (localStorage.getItem(fieldName) !== '') && (localStorage.getItem(fieldName) !== null) ? JSON.parse(localStorage.getItem(fieldName)) : [{ selected: '', source: '' }];
              console.log('valuesLS =', valuesLS);
              /* console.log('localStorage =', localStorage.getItem('selectSrc'), 'equal to empty', localStorage.getItem('selectSrc') === '', 'to null', localStorage.getItem('selectSrc') === null, 'to undefined', localStorage.getItem('selectSrc') === undefined);
              const selectSrc = (localStorage.getItem('selectSrc') !== '') || (localStorage.getItem('selectSrc') !== null) ? JSON.parse(localStorage.getItem('selectSrc')) : [];
              console.log('selectSrc =', selectSrc);
              const source = selectSrc.filter(src => src.field !== fieldName);
                console.log('source =', source);
              const sourceCurVal = selectSrc.some(src => src.field === fieldName) ? selectSrc.find(src => src.field === fieldName).source : '';
                console.log('sourceCurVal =', sourceCurVal); */

              const select = [];
              if (valuesLS.selected !== JSON.stringify(values)) {
                // console.log('local storage =', valuesLS.selected, 'values =', JSON.stringify(values));
                if (valuesLS.source === 'sidebar') {
                  select.push({ selected: JSON.stringify(values), source: '' });
                  console.log('values changed, set selectSrc = , field =', fieldName);
                } else {
                  select.push({ selected: JSON.stringify(values), source: 'qlikobject' });
                  console.log('values changed, set selectSrc = qlikobject, field =', fieldName);
                }
                console.log('Qlik Object set local storage = ', JSON.stringify(values));
                localStorage.setItem(fieldName, JSON.stringify(select));
                // localStorage.setItem('lastQlikAppId', app.id);
              } else if (valuesLS.source === 'sidebar') {
                select.push({ selected: JSON.stringify(values), source: '' });
                console.log('values changed, set selectSrc = , field =', fieldName);
                localStorage.setItem(fieldName, JSON.stringify(select));
              }
            });
          }
        });
        resolve(app);
      });
    });
  } catch (error) {
    throw new Error(error);
  }
};

export default qApp;
