/**
 * @class ActivaStock.controller.Main
 * @extends Ext.app.Controller
 *
 * This is an abstract base class that is extended by both the phone and tablet versions. This controller is
 * never directly instantiated, it just provides a set of common functionality that the phone and tablet
 * subclasses both extend.
 */
Ext.define('eleve.controller.Main', {
    extend: 'Ext.app.Controller',

    config: {
        /**
         * @private
         */
        viewCache: [],

        refs: {
            map: '[action=map]',
            mapMarker: '[action=mapMarker]',
            nextButton: '[action=nextButton]'
        },

        control: {
            map: {
                tap: 'onMapTap'
            },
            mapMarker: {
                tap: 'onMapTap'
            },
            nextButton: {
                release: 'onNextButton'
            }
        },
        routes: {
            '': 'showRoot',
            'loading': 'showLoading',
            'setteam': 'showSetEquipe',
            'map': 'showMap',
            'fin': 'showFin',
            'question/:id': 'showQuestion'
        }
    },
    /********************************
     * QUESTIONS
     * ******************************/
    /**
     * onMapTap
     * Quand le bouton suivant est cliqué.
     */
    onMapTap: function() {
        console.log('map tap');
        var nq = this.getCurrentQuestion();
        if (nq)
            this.redirectTo('question/'+nq.get('id'));
    },
    /**
     * onNextButton
     * Quand le bouton suivant est cliqué.
      */
     onNextButton: function() {
        var me = this;
        //Vérification des données
        var curview = this._indexViews['eleve.view.Question'];
        var results = curview.getResults();
        console.log('results',results);

        //si erreur
        if (!results) return;

        //affichage de la confirmation
        Ext.Msg.confirm('Confirmez la saisie.','Etes-vous sur de valider votre saisie ? Vous ne pourrez pas revenir en arrière.',function (value){
            if (value=="yes") {
                //on vérifie la catégorie de bloquage
                var cq = me.getCurrentQuestion();
                var ccq = cq.getBloquage();

                var nq = me.getNextQuestion();
                var cnq = nq.getBloquage();

                //enregistrement des résultats
                var url = eleve.utils.Config.getResultUrl();
                Ext.Ajax.request({
                    url: url,
                    useDefaultXhrHeader: false,
                    method: 'POST',
                    data: {
                        result: results
                    },
                    success: function(response, opts) {
                        var obj = Ext.decode(response.responseText);
                        if (obj.success){
                            console.log('OK OK');
                        }

                    },
                    failure: function(response, opts) {
                        //suppression du masque
                        console.log('Récupération de session erreur ' + response.status);
                        Ext.Msg.alert('Erreur de connexion', 'Il y a un problème ... Veuillez appeler l\'animateur');
                    }
                });


                //Si il y a un bloquage et qu'il s'agit de la meme catégorie, alors il ne faut rien faire.
                if ((!cnq&&!ccq)||(cnq&&ccq&&cnq.cat==ccq.cat))
                    me.redirectTo('question/' + nq.get('id'));
                else {
                    me._currentQuestion = nq.get('Ordre');
                    me.redirectTo('map');
                }
            }
        })
    },
    /**
     * getCurrentQuestion
     * recherche de la question courante
     */
    getCurrentQuestion: function () {
        var q = Ext.getStore('Questions');
        var nq = q.findRecord('Ordre', this._currentQuestion);
        if (nq) {
            return nq;
        } else {
            this.redirectTo('fin');
        }
    },
    /* Ordre de la question courante. */
    _currentQuestion: 1,
    /**
     * getNextQuestion
     * recherche de la question suivante
     * @returns {Ext.data.Model|*}
     */
    getNextQuestion: function () {
        var q = Ext.getStore('Questions');
        var nq = q.findRecord('Ordre', this._currentQuestion + 1);
        if (nq) {
            return nq;
        } else {
            Ext.Msg.alert('Erreur il n\'y pas de question suivante. Veuillez vérifier l\'ordre des questions...');
        }
    },
    /********************************
     * NAVIGATION
     * ******************************/
    /***
     * onBackTap
     * On presse le bouton back
     */
    onBackTap: function ( button, e, eOpts ) {
        console.log('itemtap back');
        var appHistory = this.getApplication().getHistory();

        // fire previous route
        appHistory.back();

        // prevent the default navigation view
        // back button behavior from firing
        return false;
    },
    _indexViews: [],
    _currentLevel: 0,
    manageView: function (level,name_view) {
        console.log('---- show view ----', name_view,'level',level);

        var commview;
        //si pas de session active retour à la racine
        if (name_view!="eleve.view.Loading"&&name_view!="eleve.view.SetEquipe"&&!eleve.utils.Config.getSessionActive()){
            console.log('session active NOK redirect to loading');
            this.redirectTo('loading');
            return;
        }

        //si pas chargé alors redirection vers le loading
        if (name_view!="eleve.view.Loading"&&!eleve.utils.Config.getLoaded())
            this.redirectTo('loading');

        //si equipe dejà définie sur la page equipê alors redirection map
        if ((name_view=="eleve.view.SetEquipe"||name_view=="eleve.view.Loading")&&eleve.utils.Config.getSessionActive()&&eleve.utils.Config.getLoaded()){
            console.log('session active OK redirect to map');
            this.redirectTo('map');
            return;
        }

        //gestion des effets
        switch (this._currentLevel-level){
            case 1:
                //_____________________________________________________________________________________________________________
                //                                                                                                  ANIMATIONS
                Ext.Viewport.getLayout().setAnimation({type: 'slide', direction: 'right'});
                //_____________________________________________________________________________________________________________
                break;
            case -1:
                //_____________________________________________________________________________________________________________
                //                                                                                                  ANIMATIONS
                Ext.Viewport.getLayout().setAnimation({type: 'slide', direction: 'left'});
                //_____________________________________________________________________________________________________________
                break;
            default:
                //_____________________________________________________________________________________________________________
                //                                                                                                  ANIMATIONS
                Ext.Viewport.getLayout().setAnimation({type: 'fade', direction: 'left'});
                //____________________________________________________________________________________________________________
                break;
        }

        //maintenance de l'index des vues chargées
        if (this._indexViews[name_view]){
            console.log();
            commview = this._indexViews[name_view];
        }else{
            this._indexViews[name_view] = commview = Ext.create(name_view);
        }
        Ext.Viewport.setActiveItem(commview);
        this._currentLevel=level;

        return commview;
    },
    /********************************
     * LOADING
     * ******************************/
     _thingsToLoad: 7,
      onLoadStore: function (msg) {
          console.log('load store',this._thingsToLoad, msg);
          this._thingsToLoad--;
          if (this._thingsToLoad==0){
              eleve.utils.Config.setLoaded(true);
              this.redirectTo('setteam');
              console.log('***** LOADED *****');
          }
     },
    /********************************
     * ROUTING
     * ******************************/

     showLoading: function () {
        console.log('showLoading');
        var me  = this;

        //affichage de l'ecran de loading
        this.manageView(0, 'eleve.view.Loading');

        //chargement des stores
        var categories = Ext.getStore('Categories');
         categories.on({
             load: function () {
                 me.onLoadStore('categories');
                 categories.removeListener('load');
             }
         });
        categories.load();
        var maps = Ext.getStore('Maps');
         maps.on({
             load: function () {
                 me.onLoadStore('maps');
                 maps.removeListener('load');
             }
         });
        maps.load();
        var questions = Ext.getStore('Questions');
         questions.on({
             load: function () {
                 me.onLoadStore('questions');
                 questions.removeListener('load');
             }
         });
        questions.load();
        var typequestions = Ext.getStore('TypeQuestions');
        typequestions.on({
            load: function () {
                me.onLoadStore('typequestions');
                typequestions.removeListener('load');
            }
        });
        typequestions.load();
        var typequestionvaleurs = Ext.getStore('TypeQuestionValeurs');
        typequestionvaleurs.on({
            load: function () {
                me.onLoadStore('typequestionvaleurs');
                typequestionvaleurs.removeListener('load');
            }
        });
        typequestionvaleurs.load();
        var typereponses = Ext.getStore('TypeReponses');
         typereponses.on({
             load: function () {
                 me.onLoadStore('typereponses');
                 typereponses.removeListener('load');
             }
         });
        typereponses.load();


        //interrogation du serveur pour savoir si il y a une session en cours.
        var url = eleve.utils.Config.getSessionUrl();
        Ext.Ajax.request({
            url: url,
            useDefaultXhrHeader: false,
            method: 'POST',
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);
                if (obj.success){
                    //enregistrement des informations de session
                    eleve.utils.Config.setSessionId(obj.id);
                    eleve.utils.Config.setSessionName(obj.name);
                    console.log('set session information',obj.id, obj.name);

                    //redirection
                    //me.redirectTo('setteam');
                    me.onLoadStore('session');
                }

            },
            failure: function(response, opts) {
                //suppression du masque
                console.log('Récupération de session erreur ' + response.status);
                Ext.Msg.alert('Erreur de connexion', 'Il y a un problème ... Veuillez appeler l\'animateur');
            }
        });
    },
    showRoot: function () {
        this.redirectTo('loading');
    },
    showSetEquipe: function () {
        this.manageView(0, 'eleve.view.SetEquipe');
    },
    showFin: function () {
        this.manageView(0, 'eleve.view.Fin');
    },
    showMap: function () {
        if (!eleve.utils.Config.getLoaded()) {
            this.redirectTo('loading');
            return;
        }
        var question = this.getCurrentQuestion();
        var position = question.getMapPosition();
        var curview = this.manageView(0, 'eleve.view.Map');
        curview.setPosition(position);

    },
    showQuestion: function (id) {
        if (!eleve.utils.Config.getLoaded()) {
            this.redirectTo('loading');
            return;
        }
        var ficheview = this.manageView(1, 'eleve.view.Question');
        var questionStore = Ext.getStore('Questions');
        var record = questionStore.getById(id);
        this._currentQuestion = record.get('Ordre');
        ficheview.setRecord(record);
    }
});