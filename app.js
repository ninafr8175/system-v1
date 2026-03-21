let state = { // objet principal qui stocke les données de l'application
  nowTask: "Commencer le système", // texte affiché dans la zone MAINTENANT
  speechIndex: 0, // index du texte actuel dans le mode parole
  workTask: "Faire 1 tâche simple" // texte affiché dans le mode travail
}; // fin de l'objet state

let speechTexts = [ // tableau contenant les 3 textes du mode parole
  "Bonjour, aujourd’hui je vais expliquer ce que je fais dans mon travail.", // texte 1 en français
  "Today I will explain a simple idea clearly and confidently.", // texte 2 en anglais
  "大家好，我今天练习说中文。" // texte 3 en mandarin
]; // fin du tableau speechTexts

let workInterval = null; // variable qui gardera l'identifiant du timer travail en cours
let speechInterval = null; // variable qui gardera l'identifiant du timer parole en cours
let workTime = 1500; // durée du mode travail en secondes = 25 minutes
let speechTime = 300; // durée du mode parole en secondes = 5 minutes

function load() { // fonction appelée au démarrage pour charger les données sauvegardées
  let saved = localStorage.getItem("state"); // récupère la valeur "state" depuis le stockage local du navigateur
  if (saved) { // vérifie si une ancienne sauvegarde existe
    let parsed = JSON.parse(saved); // transforme le texte JSON sauvegardé en objet JavaScript
    state = { ...state, ...parsed }; // fusionne les valeurs par défaut avec les anciennes valeurs sauvegardées
  } // fin du bloc if
  updateUI(); // met à jour l'affichage à l'écran après le chargement
} // fin de la fonction load

function save() { // fonction qui sauvegarde l'état actuel dans le navigateur
  localStorage.setItem("state", JSON.stringify(state)); // convertit state en texte JSON et le stocke dans localStorage
} // fin de la fonction save

function updateUI() { // fonction qui met à jour les textes affichés dans l'interface
  document.getElementById("nowTask").innerText = state.nowTask; // affiche la tâche actuelle dans la zone MAINTENANT
  document.getElementById("workTask").innerText = state.workTask; // affiche la tâche du mode travail
  document.getElementById("speechText").innerText = speechTexts[state.speechIndex] || speechTexts[0]; // affiche le texte courant du mode parole ou le premier si l'index est invalide
} // fin de la fonction updateUI

function showMode(mode) { // fonction qui affiche un seul écran et cache tous les autres
  document.getElementById("home").classList.add("hidden"); // cache l'écran d'accueil
  document.getElementById("wake").classList.add("hidden"); // cache l'écran réveil
  document.getElementById("work").classList.add("hidden"); // cache l'écran travail
  document.getElementById("speech").classList.add("hidden"); // cache l'écran parole
  document.getElementById(mode).classList.remove("hidden"); // affiche seulement l'écran demandé
} // fin de la fonction showMode

function goHome() { // fonction qui ramène à l'écran d'accueil
  showMode("home"); // affiche l'écran home
} // fin de la fonction goHome

function completeTask() { // fonction appelée quand on clique sur Terminé dans MAINTENANT
  state.nowTask = "Choisir une nouvelle tâche"; // remplace la tâche actuelle par un nouveau texte simple
  save(); // sauvegarde le nouvel état
  updateUI(); // rafraîchit l'affichage
} // fin de la fonction completeTask

function startTimer() { // fonction qui démarre le timer du mode travail
  if (workInterval) { // vérifie si un timer travail tourne déjà
    return; // quitte la fonction pour éviter de lancer plusieurs timers en même temps
  } // fin du if

  let display = document.getElementById("timer"); // récupère l'élément HTML où afficher le temps du mode travail

  if (display.innerText === "") { // vérifie si la zone est encore vide au premier lancement
    display.innerText = "25:00"; // affiche la valeur initiale avant le premier tic
  } // fin du if

  workInterval = setInterval(() => { // démarre une boucle qui s'exécute toutes les secondes
    let min = Math.floor(workTime / 60); // calcule le nombre de minutes restantes
    let sec = workTime % 60; // calcule le nombre de secondes restantes
    display.innerText = min + ":" + (sec < 10 ? "0" : "") + sec; // affiche le temps au format mm:ss
    workTime--; // enlève une seconde au compteur

    if (workTime < 0) { // vérifie si le temps est terminé
      clearInterval(workInterval); // arrête la boucle du timer travail
      workInterval = null; // remet la variable d'intervalle à vide
      workTime = 1500; // remet la durée par défaut à 25 minutes
      display.innerText = "Terminé !"; // affiche le message de fin
    } // fin du if de fin de timer
  }, 1000); // demande d'exécuter la fonction toutes les 1000 millisecondes = 1 seconde
} // fin de la fonction startTimer

function stopTimer() { // fonction qui arrête le timer travail sans remettre le temps à zéro
  clearInterval(workInterval); // arrête l'intervalle si un timer existe
  workInterval = null; // vide la référence du timer travail
} // fin de la fonction stopTimer

function resetTimer() { // fonction qui remet le timer travail à son état initial
  clearInterval(workInterval); // arrête l'intervalle si un timer existe
  workInterval = null; // vide la référence du timer travail
  workTime = 1500; // remet le temps à 25 minutes
  document.getElementById("timer").innerText = "25:00"; // réaffiche la valeur initiale dans l'écran travail
} // fin de la fonction resetTimer

function nextSpeech() { // fonction qui passe au texte suivant dans le mode parole
  state.speechIndex = (state.speechIndex + 1) % speechTexts.length; // augmente l'index puis revient à 0 à la fin du tableau
  save(); // sauvegarde le nouvel index dans le stockage local
  updateUI(); // met à jour le texte affiché à l'écran
} // fin de la fonction nextSpeech

function startSpeech() { // fonction qui démarre le timer du mode parole
  if (speechInterval) { // vérifie si un timer parole tourne déjà
    return; // quitte la fonction pour éviter de lancer plusieurs timers en même temps
  } // fin du if

  let display = document.getElementById("speechTimer"); // récupère l'élément HTML où afficher le temps du mode parole

  if (display.innerText === "") { // vérifie si la zone est vide au premier lancement
    display.innerText = "5:00"; // affiche la valeur initiale avant le premier tic
  } // fin du if

  speechInterval = setInterval(() => { // démarre une boucle qui s'exécute toutes les secondes
    let min = Math.floor(speechTime / 60); // calcule le nombre de minutes restantes
    let sec = speechTime % 60; // calcule le nombre de secondes restantes
    display.innerText = min + ":" + (sec < 10 ? "0" : "") + sec; // affiche le temps au format mm:ss
    speechTime--; // enlève une seconde au compteur

    if (speechTime < 0) { // vérifie si le temps est terminé
      clearInterval(speechInterval); // arrête la boucle du timer parole
      speechInterval = null; // remet la variable d'intervalle à vide
      speechTime = 300; // remet la durée par défaut à 5 minutes
      display.innerText = "Bravo ! 🎉"; // affiche le message de fin
    } // fin du if de fin de timer
  }, 1000); // demande d'exécuter la fonction toutes les 1000 millisecondes = 1 seconde
} // fin de la fonction startSpeech

function stopSpeech() { // fonction qui arrête le timer parole sans remettre le temps à zéro
  clearInterval(speechInterval); // arrête l'intervalle si un timer existe
  speechInterval = null; // vide la référence du timer parole
} // fin de la fonction stopSpeech

function resetSpeech() { // fonction qui remet le timer parole à son état initial
  clearInterval(speechInterval); // arrête l'intervalle si un timer existe
  speechInterval = null; // vide la référence du timer parole
  speechTime = 300; // remet le temps à 5 minutes
  document.getElementById("speechTimer").innerText = "5:00"; // réaffiche la valeur initiale dans l'écran parole
} // fin de la fonction resetSpeech

load(); // lance le chargement initial de l'application dès l'ouverture de la page