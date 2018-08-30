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
        app.getList('SelectionObject', function () {
          for (let i = 0; i < fields.length; i++) {
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
              console.log('reply:', reply.qListObject);
              let rows = [];
              if (reply.qListObject.qDataPages > 0) rows = _.flatten(reply.qListObject.qDataPages[0].qMatrix);
              const selected = rows.filter(function (row) {
                return row.qState === 'S';
              });
              const values = [];
              for (let j = 0; j < selected.length; j++) {
                values.push(selected[j].qText);
              }
              // localStorage.setItem(reply.qListObject.qDimensionInfo.qFallbackTitle, JSON.stringify(values));
              if (localStorage.getItem(reply.qListObject.qDimensionInfo.qFallbackTitle) !== JSON.stringify(values)) {
                console.log('local storage =', localStorage.getItem(reply.qListObject.qDimensionInfo.qFallbackTitle), 'values =', JSON.stringify(values));
                if (localStorage.getItem('selectSrc') === 'sidebar') {
                  console.log('selectSrc = ; values changed');
                  localStorage.setItem('selectSrc', '');
                } else {
                  console.log('selectSrc = qlikobject');
                  localStorage.setItem('selectSrc', 'qlikobject');
                }
                console.log('Qlik Object set local storage = ', JSON.stringify(values));
                localStorage.setItem(reply.qListObject.qDimensionInfo.qFallbackTitle, JSON.stringify(values));
                // localStorage.setItem('lastQlikAppId', app.id);
              }
              if (localStorage.getItem('selectSrc') === 'sidebar') {
                console.log('selectSrc = ; values not changed');
                localStorage.setItem('selectSrc', '');
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
