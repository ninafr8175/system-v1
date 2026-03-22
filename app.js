let state = { // objet principal qui stocke l'état global de l'application
  activeMode: "none", // mode actuellement actif : "none", "wake", "work" ou "speech"
  nowTask: "Aucune tâche en cours", // texte affiché dans la zone MAINTENANT sur l'accueil
  statusMessage: "", // petit message d'information affiché sur l'accueil
  wakeModeMessage: "", // petit message affiché directement dans l'écran réveil
  workTask: "Faire 1 tâche simple", // tâche affichée dans le mode travail
  speechIndex: 0, // index du texte actuel dans le tableau des textes parole
  wakeMusicLink: "", // lien musique personnalisé pour le mode réveil, stocké localement dans le navigateur
  wakeProgress: { // sous-objet qui stocke l'état des cases du mode réveil
    awake: false, // case "Je suis réveillée"
    up: false, // case "Je me suis levée"
    water: false, // case "Eau"
    music: false // case "Musique"
  }, // fin de l'objet wakeProgress
  workCompleted: false, // indique si une session travail a été terminée
  speechCompleted: false // indique si une session parole a été terminée
}; // fin de l'objet state

let speechTexts = [ // tableau contenant les textes du mode parole
  "Bonjour, aujourd’hui je vais expliquer ce que je fais dans mon travail.", // texte 1 en français
  "Today I will explain a simple idea clearly and confidently.", // texte 2 en anglais
  "大家好，我今天练习说中文。" // texte 3 en mandarin
]; // fin du tableau speechTexts

let workInterval = null; // variable qui gardera l'identifiant du timer travail en cours
let speechInterval = null; // variable qui gardera l'identifiant du timer parole en cours
let workTime = 1500; // temps du mode travail en secondes = 25 minutes
let speechTime = 300; // temps du mode parole en secondes = 5 minutes

function load() { // charge les données sauvegardées au démarrage de l'application
  let saved = localStorage.getItem("state"); // récupère l'état sauvegardé dans le navigateur
  if (saved) { // vérifie si une sauvegarde existe
    let parsed = JSON.parse(saved); // transforme le texte JSON en objet JavaScript
    state = { ...state, ...parsed }; // fusionne les valeurs par défaut avec les anciennes données sauvegardées
    state.wakeProgress = { ...state.wakeProgress, ...(parsed.wakeProgress || {}) }; // fusionne proprement les cases du réveil
  } // fin du bloc if
  updateUI(); // met l'interface à jour après chargement
} // fin de la fonction load

function save() { // sauvegarde l'état actuel dans le navigateur
  localStorage.setItem("state", JSON.stringify(state)); // convertit l'objet state en texte JSON et le stocke
} // fin de la fonction save

function updateUI() { // met à jour tous les éléments visibles de l'interface
  document.getElementById("nowTask").innerText = state.nowTask; // affiche la tâche actuelle sur l'accueil
  document.getElementById("statusMessage").innerText = state.statusMessage; // affiche le message d'information sur l'accueil
  document.getElementById("wakeModeMessage").innerText = state.wakeModeMessage; // affiche le message directement dans le mode réveil
  document.getElementById("workTask").innerText = state.workTask; // affiche la tâche de travail dans le mode travail
  document.getElementById("speechText").innerText = speechTexts[state.speechIndex] || speechTexts[0]; // affiche le texte courant du mode parole
  document.getElementById("wakeAwake").checked = state.wakeProgress.awake; // coche ou décoche la case 1 du réveil
  document.getElementById("wakeUp").checked = state.wakeProgress.up; // coche ou décoche la case 2 du réveil
  document.getElementById("wakeWater").checked = state.wakeProgress.water; // coche ou décoche la case 3 du réveil
  document.getElementById("wakeMusic").checked = state.wakeProgress.music; // coche ou décoche la case 4 du réveil
  document.getElementById("wakeMusicLinkInput").value = state.wakeMusicLink; // affiche dans le champ le lien musique actuellement sauvegardé

  if (document.getElementById("timer").innerText === "") { // vérifie si le timer travail est vide
    document.getElementById("timer").innerText = "25:00"; // affiche la valeur initiale du timer travail
  } // fin du if

  if (document.getElementById("speechTimer").innerText === "") { // vérifie si le timer parole est vide
    document.getElementById("speechTimer").innerText = "5:00"; // affiche la valeur initiale du timer parole
  } // fin du if
  updateModeButtons(); // met à jour l'état visuel des boutons de modes sur l'accueil
} // fin de la fonction updateUI

function updateModeButtons() { // met à jour l'état disabled des boutons de modes sur l'accueil
  let wakeButton = document.getElementById("homeWakeButton"); // récupère le bouton Réveil de l'accueil
  let workButton = document.getElementById("homeWorkButton"); // récupère le bouton Travail de l'accueil
  let speechButton = document.getElementById("homeSpeechButton"); // récupère le bouton Parole de l'accueil

  if (!wakeButton || !workButton || !speechButton) { // vérifie que les 3 boutons existent bien dans le HTML
    return; // quitte la fonction si un bouton manque
  } // fin du if

  wakeButton.disabled = state.activeMode !== "none" && state.activeMode !== "wake"; // désactive Réveil si un autre mode est actif
  workButton.disabled = state.activeMode !== "none" && state.activeMode !== "work"; // désactive Travail si un autre mode est actif
  speechButton.disabled = state.activeMode !== "none" && state.activeMode !== "speech"; // désactive Parole si un autre mode est actif
} // fin de la fonction

function hideAllScreens() { // cache tous les écrans de l'application
  document.getElementById("home").classList.add("hidden"); // cache l'accueil
  document.getElementById("wake").classList.add("hidden"); // cache le réveil
  document.getElementById("work").classList.add("hidden"); // cache le travail
  document.getElementById("speech").classList.add("hidden"); // cache la parole
} // fin de la fonction hideAllScreens

function getModeLabel(mode) { // retourne un nom lisible pour un mode technique
  if (mode === "wake") { // vérifie si le mode est réveil
    return "Réveil"; // retourne le libellé Réveil
  } // fin du if wake

  if (mode === "work") { // vérifie si le mode est travail
    return "Travail"; // retourne le libellé Travail
  } // fin du if work

  if (mode === "speech") { // vérifie si le mode est parole
    return "Parole"; // retourne le libellé Parole
  } // fin du if speech

  return "Aucun"; // retourne Aucun si rien ne correspond
} // fin de la fonction getModeLabel

function clearMessages() { // remet à vide les messages visibles dans l'app
  state.statusMessage = ""; // vide le message affiché sur l'accueil
  state.wakeModeMessage = ""; // vide le message affiché dans le mode réveil
} // fin de la fonction clearMessages

function setCurrentTaskFromActiveMode() { // met à jour la zone MAINTENANT en fonction du vrai mode actif
  if (state.activeMode === "wake") { // vérifie si le mode actif est réveil
    state.nowTask = "Mode actif : Réveil"; // met à jour la tâche actuelle avec le mode réveil
    return; // quitte la fonction
  } // fin du if wake

  if (state.activeMode === "work") { // vérifie si le mode actif est travail
    state.nowTask = "Mode actif : Travail"; // met à jour la tâche actuelle avec le mode travail
    return; // quitte la fonction
  } // fin du if work

  if (state.activeMode === "speech") { // vérifie si le mode actif est parole
    state.nowTask = "Mode actif : Parole"; // met à jour la tâche actuelle avec le mode parole
    return; // quitte la fonction
  } // fin du if speech

  state.nowTask = "Aucune tâche en cours"; // remet un texte neutre si aucun mode n'est actif
} // fin de la fonction setCurrentTaskFromActiveMode

function showMode(mode) { // ouvre un mode si aucun autre mode n'est déjà actif
  if (state.activeMode !== "none" && state.activeMode !== mode) { // vérifie si un autre mode est déjà actif
    state.statusMessage = "Un mode est déjà en cours : " + getModeLabel(state.activeMode); // affiche un message de blocage sur l'accueil
    setCurrentTaskFromActiveMode(); // remet la zone MAINTENANT en cohérence avec le vrai mode actif
    save(); // sauvegarde l'état mis à jour
    updateUI(); // rafraîchit l'affichage
    hideAllScreens(); // cache tous les écrans
    document.getElementById("home").classList.remove("hidden"); // réaffiche l'accueil pour montrer clairement le blocage
    return; // quitte la fonction sans ouvrir le nouveau mode
  } // fin du if de blocage

  state.activeMode = mode; // définit le mode demandé comme mode actif
  clearMessages(); // efface les anciens messages
  setCurrentTaskFromActiveMode(); // met à jour MAINTENANT pour refléter le vrai mode actif
  save(); // sauvegarde le nouvel état
  updateUI(); // rafraîchit l'affichage
  hideAllScreens(); // cache tous les écrans
  document.getElementById(mode).classList.remove("hidden"); // affiche seulement le mode demandé
} // fin de la fonction showMode

function goHome() { // revient à l'accueil sans terminer le mode en cours
  setCurrentTaskFromActiveMode(); // remet la zone MAINTENANT en cohérence avec le vrai mode actif
  updateUI(); // rafraîchit l'affichage
  hideAllScreens(); // cache tous les écrans
  document.getElementById("home").classList.remove("hidden"); // affiche l'accueil
} // fin de la fonction goHome

function saveWakeProgress() { // sauvegarde les cases cochées du mode réveil
  state.wakeProgress.awake = document.getElementById("wakeAwake").checked; // lit la valeur de la case "Je suis réveillée"
  state.wakeProgress.up = document.getElementById("wakeUp").checked; // lit la valeur de la case "Je me suis levée"
  state.wakeProgress.water = document.getElementById("wakeWater").checked; // lit la valeur de la case "Eau"
  state.wakeProgress.music = document.getElementById("wakeMusic").checked; // lit la valeur de la case "Musique"
  save(); // sauvegarde l'état mis à jour
} // fin de la fonction saveWakeProgress

function saveWakeMusicLink() { // sauvegarde le lien musique du mode réveil
  let input = document.getElementById("wakeMusicLinkInput").value.trim(); // récupère le texte saisi et enlève les espaces inutiles
  state.wakeMusicLink = input; // enregistre ce lien dans l'état global
  state.wakeModeMessage = input ? "Lien musique enregistré." : "Lien musique vide enregistré."; // affiche un message visible directement dans le mode réveil
  save(); // sauvegarde l'état dans le navigateur
  updateUI(); // met à jour l'interface
} // fin de la fonction saveWakeMusicLink

function openWakeMusicLink() { // ouvre le lien musique du mode réveil
  if (!state.wakeMusicLink) { // vérifie si aucun lien n'a été enregistré
    state.wakeModeMessage = "Ajoute d’abord un lien musique."; // affiche un message visible dans le mode réveil
    save(); // sauvegarde le message
    updateUI(); // met à jour l'interface
    return; // quitte la fonction sans rien ouvrir
  } // fin du if de contrôle

  state.wakeModeMessage = "Ouverture de la musique..."; // affiche un message visible avant l'ouverture
  save(); // sauvegarde le message
  updateUI(); // met à jour l'interface
  window.location.href = state.wakeMusicLink; // ouvre le lien dans le navigateur courant pour plus de fiabilité
} // fin de la fonction openWakeMusicLink

function resetWakeModeState() { // remet à zéro tout ce qui concerne le mode réveil
  state.wakeProgress = { awake: false, up: false, water: false, music: false }; // décoche les cases du réveil
  state.wakeModeMessage = ""; // efface le message spécifique au réveil
} // fin de la fonction resetWakeModeState

function completeWakeMode() { // termine le mode réveil seulement si toutes les cases sont cochées
  saveWakeProgress(); // commence par sauvegarder les dernières cases cochées
  let allChecked = state.wakeProgress.awake && state.wakeProgress.up && state.wakeProgress.water && state.wakeProgress.music; // vérifie si les 4 cases sont cochées

  if (!allChecked) { // vérifie si tout n'est pas encore terminé
    state.wakeModeMessage = "Coche toutes les étapes du réveil avant de terminer."; // affiche un message visible directement dans le mode réveil
    save(); // sauvegarde le message
    updateUI(); // met l'écran à jour
    return; // quitte la fonction sans terminer le mode
  } // fin du if de blocage réveil

  state.activeMode = "none"; // retire le mode actif
  state.nowTask = "Aucune tâche en cours"; // remet MAINTENANT à une valeur neutre
  state.statusMessage = "Mode Réveil terminé."; // affiche un message de confirmation sur l'accueil
  resetWakeModeState(); // remet à zéro l'état du mode réveil
  save(); // sauvegarde l'état final
  updateUI(); // met l'interface à jour
  hideAllScreens(); // cache tous les écrans
  document.getElementById("home").classList.remove("hidden"); // revient à l'accueil
} // fin de la fonction completeWakeMode

function startTimer() { // démarre le timer du mode travail
  if (state.activeMode !== "work") { // vérifie que le mode actif est bien travail
    state.statusMessage = "Le mode Travail doit être actif pour lancer ce timer."; // affiche un message si le mode n'est pas correct
    save(); // sauvegarde le message
    updateUI(); // met à jour l'interface
    return; // quitte la fonction
  } // fin du if de sécurité

  if (workInterval) { // vérifie si un timer travail tourne déjà
    return; // évite de lancer un deuxième timer travail en parallèle
  } // fin du if

  state.workCompleted = false; // indique qu'une nouvelle session travail est en cours
  clearMessages(); // efface les anciens messages
  save(); // sauvegarde l'état
  updateUI(); // met à jour l'interface

  let display = document.getElementById("timer"); // récupère la zone d'affichage du timer travail

  workInterval = setInterval(() => { // démarre une boucle qui s'exécute toutes les secondes
    let min = Math.floor(workTime / 60); // calcule les minutes restantes
    let sec = workTime % 60; // calcule les secondes restantes
    display.innerText = min + ":" + (sec < 10 ? "0" : "") + sec; // affiche le temps au format mm:ss
    workTime--; // enlève une seconde

    if (workTime < 0) { // vérifie si le temps est terminé
      clearInterval(workInterval); // arrête le timer travail
      workInterval = null; // vide la référence du timer travail
      workTime = 1500; // remet le temps par défaut à 25 minutes
      state.workCompleted = true; // indique que la session travail est terminée
      state.statusMessage = "Session Travail terminée."; // affiche un message de confirmation
      display.innerText = "Terminé !"; // affiche le message dans la zone du timer
      save(); // sauvegarde l'état final
      updateUI(); // met à jour l'interface
    } // fin du if de fin de timer
  }, 1000); // répète toutes les secondes
} // fin de la fonction startTimer

function stopTimer() { // arrête le timer travail sans le réinitialiser
  clearInterval(workInterval); // arrête le timer si un intervalle existe
  workInterval = null; // vide la référence du timer travail
} // fin de la fonction stopTimer

function resetTimer() { // remet le timer travail à zéro
  clearInterval(workInterval); // arrête le timer si un intervalle existe
  workInterval = null; // vide la référence du timer travail
  workTime = 1500; // remet le temps de travail à 25 minutes
  state.workCompleted = false; // indique que la session n'est pas considérée comme terminée
  document.getElementById("timer").innerText = "25:00"; // réaffiche la valeur initiale du timer
  save(); // sauvegarde l'état
} // fin de la fonction resetTimer

function completeWorkMode() { // termine le mode travail seulement si la session est considérée comme faite
  if (!state.workCompleted) { // vérifie si la session travail n'est pas encore terminée
    state.statusMessage = "Termine la session Travail avant de fermer ce mode."; // affiche un message explicite
    save(); // sauvegarde le message
    updateUI(); // met l'interface à jour
    return; // quitte la fonction sans terminer le mode
  } // fin du if de blocage travail

  clearInterval(workInterval); // arrête le timer s'il tourne encore
  workInterval = null; // vide la référence du timer
  workTime = 1500; // remet le temps par défaut à 25 minutes
  state.workCompleted = false; // remet l'état de complétion à faux pour la prochaine utilisation
  state.activeMode = "none"; // retire le mode actif
  state.nowTask = "Aucune tâche en cours"; // remet MAINTENANT à neutre
  state.statusMessage = "Mode Travail terminé."; // affiche un message de confirmation
  document.getElementById("timer").innerText = "25:00"; // remet l'affichage du timer à zéro
  save(); // sauvegarde l'état final
  updateUI(); // met l'interface à jour
  hideAllScreens(); // cache tous les écrans
  document.getElementById("home").classList.remove("hidden"); // revient à l'accueil
} // fin de la fonction completeWorkMode

function nextSpeech() { // passe au texte suivant dans le mode parole
  state.speechIndex = (state.speechIndex + 1) % speechTexts.length; // augmente l'index et revient à 0 à la fin du tableau
  save(); // sauvegarde le nouvel index
  updateUI(); // met à jour le texte affiché
} // fin de la fonction nextSpeech

function startSpeech() { // démarre le timer du mode parole
  if (state.activeMode !== "speech") { // vérifie que le mode actif est bien parole
    state.statusMessage = "Le mode Parole doit être actif pour lancer ce timer."; // affiche un message si le mode n'est pas correct
    save(); // sauvegarde le message
    updateUI(); // met à jour l'interface
    return; // quitte la fonction
  } // fin du if de sécurité

  if (speechInterval) { // vérifie si un timer parole tourne déjà
    return; // évite de lancer plusieurs timers parole en même temps
  } // fin du if

  state.speechCompleted = false; // indique qu'une nouvelle session parole commence
  clearMessages(); // efface les anciens messages
  save(); // sauvegarde l'état
  updateUI(); // met à jour l'interface

  let display = document.getElementById("speechTimer"); // récupère la zone d'affichage du timer parole

  speechInterval = setInterval(() => { // démarre une boucle toutes les secondes
    let min = Math.floor(speechTime / 60); // calcule les minutes restantes
    let sec = speechTime % 60; // calcule les secondes restantes
    display.innerText = min + ":" + (sec < 10 ? "0" : "") + sec; // affiche le temps au format mm:ss
    speechTime--; // enlève une seconde

    if (speechTime < 0) { // vérifie si le temps est terminé
      clearInterval(speechInterval); // arrête le timer parole
      speechInterval = null; // vide la référence du timer parole
      speechTime = 300; // remet le temps par défaut à 5 minutes
      state.speechCompleted = true; // indique que la session parole est terminée
      state.statusMessage = "Session Parole terminée."; // affiche un message de confirmation
      display.innerText = "Bravo ! 🎉"; // affiche le message final dans la zone du timer
      save(); // sauvegarde l'état final
      updateUI(); // met à jour l'interface
    } // fin du if de fin de timer
  }, 1000); // répète toutes les secondes
} // fin de la fonction startSpeech

function stopSpeech() { // arrête le timer parole sans le réinitialiser
  clearInterval(speechInterval); // arrête le timer si un intervalle existe
  speechInterval = null; // vide la référence du timer parole
} // fin de la fonction stopSpeech

function resetSpeech() { // remet le timer parole à zéro
  clearInterval(speechInterval); // arrête le timer si un intervalle existe
  speechInterval = null; // vide la référence du timer parole
  speechTime = 300; // remet le temps de parole à 5 minutes
  state.speechCompleted = false; // indique que la session n'est pas terminée
  document.getElementById("speechTimer").innerText = "5:00"; // remet l'affichage initial du timer parole
  save(); // sauvegarde l'état
} // fin de la fonction resetSpeech

function completeSpeechMode() { // termine le mode parole seulement si la session est considérée comme faite
  if (!state.speechCompleted) { // vérifie si la session parole n'est pas encore terminée
    state.statusMessage = "Termine la session Parole avant de fermer ce mode."; // affiche un message explicite
    save(); // sauvegarde le message
    updateUI(); // met l'interface à jour
    return; // quitte la fonction sans terminer le mode
  } // fin du if de blocage parole

  clearInterval(speechInterval); // arrête le timer s'il tourne encore
  speechInterval = null; // vide la référence du timer
  speechTime = 300; // remet le temps par défaut à 5 minutes
  state.speechCompleted = false; // remet l'état de complétion à faux pour la prochaine utilisation
  state.activeMode = "none"; // retire le mode actif
  state.nowTask = "Aucune tâche en cours"; // remet MAINTENANT à neutre
  state.statusMessage = "Mode Parole terminé."; // affiche un message de confirmation
  document.getElementById("speechTimer").innerText = "5:00"; // remet l'affichage du timer à zéro
  save(); // sauvegarde l'état final
  updateUI(); // met l'interface à jour
  hideAllScreens(); // cache tous les écrans
  document.getElementById("home").classList.remove("hidden"); // revient à l'accueil
} // fin de la fonction completeSpeechMode

function cancelActiveMode() { // annule le mode actif en cours pour revenir à un état neutre
  if (state.activeMode === "wake") { // vérifie si le mode actif est réveil
    resetWakeModeState(); // remet à zéro les cases et messages du mode réveil
  } // fin du if wake

  if (state.activeMode === "work") { // vérifie si le mode actif est travail
    clearInterval(workInterval); // arrête le timer travail si nécessaire
    workInterval = null; // vide la référence du timer travail
    workTime = 1500; // remet le temps de travail à 25 minutes
    state.workCompleted = false; // remet l'état de complétion à faux
    document.getElementById("timer").innerText = "25:00"; // remet l'affichage du timer travail à zéro
  } // fin du if work

  if (state.activeMode === "speech") { // vérifie si le mode actif est parole
    clearInterval(speechInterval); // arrête le timer parole si nécessaire
    speechInterval = null; // vide la référence du timer parole
    speechTime = 300; // remet le temps de parole à 5 minutes
    state.speechCompleted = false; // remet l'état de complétion à faux
    document.getElementById("speechTimer").innerText = "5:00"; // remet l'affichage du timer parole à zéro
  } // fin du if speech

  state.activeMode = "none"; // retire le mode actif
  state.nowTask = "Aucune tâche en cours"; // remet MAINTENANT à neutre
  state.statusMessage = "Mode annulé."; // affiche un message de confirmation sur l'accueil
  save(); // sauvegarde l'état final
  updateUI(); // met à jour l'interface
  hideAllScreens(); // cache tous les écrans
  document.getElementById("home").classList.remove("hidden"); // revient à l'accueil
} // fin de la fonction cancelActiveMode

load(); // lance le chargement initial de l'application au démarrage
