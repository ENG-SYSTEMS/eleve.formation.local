Ext.define('eleve.view.Loading', {
    extend: 'Ext.Panel',
    xtype: 'loading',
    requires: [
        'Ext.TitleBar',
        'Ext.Video'
    ],
    config: {
        title: 'Chargement des données',
        items: [
            {
                docked: 'top',
                xtype: 'titlebar',
                title: eleve.utils.Config.getAppTitle(),
                style: {
                    'background-color' :'#388e6b',
                    'background-image' : 'linear-gradient(to top, #f2fafd, #68c5b6 10%, #f2fafd 98%)'
                }
            },
            {
                width: '100%',
                style: 'top: 45%;text-align: center;position:absolute;z-index:1',
                action: 'loadingText',
                html: '<h1>Chargement ...</h1>'
            }
        ]
    }
});
