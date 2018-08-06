/* eslint-disable camelcase,prefer-arrow-callback,no-plusplus,comma-dangle */
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
        app.getList('SelectionObject', function (reply) {
          let loc_selections = [];
          let j;

          for (j = 0; j < reply.qSelectionObject.qSelections.length; j++) {
            loc_selections.push({
              field: reply.qSelectionObject.qSelections[j].qField,
              selected: reply.qSelectionObject.qSelections[j].qSelected
            });
            console.log('qdt set item: lenght: ', j, ' loc_selections = ', JSON.stringify(loc_selections));
          }

          if (localStorage.getItem('selectItemLocalStorage') !== JSON.stringify(loc_selections)) {
            console.log('qdt set item = ', JSON.stringify(loc_selections));
            localStorage.setItem('selectItemLocalStorage', JSON.stringify(loc_selections));
            localStorage.setItem('lastQlikAppId', app.id);
          }
          loc_selections = [];
        });
        resolve(app);
      });
    });
  } catch (error) {
    throw new Error(error);
  }
};

export default qApp;
