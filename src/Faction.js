import {Augmentations, AugmentationNames,
        PlayerOwnedAugmentation}                from "./Augmentations.js";
import {BitNodeMultipliers}                     from "./BitNode.js";
import {CONSTANTS}                              from "./Constants.js";
import {Engine}                                 from "./engine.js";
import {FactionInfo}                            from "./FactionInfo.js";
import {Locations}                              from "./Location.js";
import {HackingMission, setInMission}           from "./Missions.js";
import {Player}                                 from "./Player.js";
import {Settings}                               from "./Settings.js";

import {dialogBoxCreate}                        from "../utils/DialogBox.js";
import {factionInvitationBoxCreate}             from "../utils/FactionInvitationBox.js";
import {clearEventListeners, createElement,
        removeChildrenFromElement}              from "../utils/HelperFunctions.js";
import {Reviver, Generic_toJSON,
        Generic_fromJSON}                       from "../utils/JSONReviver.js";
import numeral                                  from "../utils/numeral.min.js";
import {formatNumber}                           from "../utils/StringHelperFunctions.js";
import {yesNoBoxCreate, yesNoBoxGetYesButton,
        yesNoBoxGetNoButton, yesNoBoxClose}     from "../utils/YesNoBox.js";

function Faction(name="") {
    this.name 				= name;
    this.augmentations 		= [];   //Name of augmentation only
    this.info 		        = "";	//Introductory/informational text about the faction

    //Player-related properties for faction
    this.isMember 			= false; 	//Whether player is member
    this.isBanned           = false;    //Whether or not player is banned from joining this faction
    this.playerReputation 	= 0;  		//"Reputation" within faction
    this.alreadyInvited     = false;

    //Multipliers for unlocking and purchasing augmentations
    this.augmentationPriceMult = 1;
    this.augmentationRepRequirementMult = 1;

    //Faction favor
    this.favor              = 0;
    this.rolloverRep        = 0;
};

Faction.prototype.setAugmentationMultipliers = function(price, rep) {
    this.augmentationPriceMult = price;
    this.augmentationRepRequirementMult = rep;
}

Faction.prototype.setInfo = function(inf) {
	this.info = inf;
}

Faction.prototype.gainFavor = function() {
    if (this.favor == null || this.favor == undefined) {this.favor = 0;}
    if (this.rolloverRep == null || this.rolloverRep == undefined) {this.rolloverRep = 0;}
    var res = this.getFavorGain();
    if (res.length != 2) {
        console.log("Error: invalid result from getFavorGain() function");
        return;
    }
    this.favor += res[0];
    this.rolloverRep = res[1];
}

//Returns an array with [How much favor would be gained, how much favor would be left over]
Faction.prototype.getFavorGain = function() {
    if (this.favor == null || this.favor == undefined) {this.favor = 0;}
    if (this.rolloverRep == null || this.rolloverRep == undefined) {this.rolloverRep = 0;}
    var favorGain = 0, rep = this.playerReputation + this.rolloverRep;
    var reqdRep = CONSTANTS.FactionReputationToFavorBase *
                  Math.pow(CONSTANTS.FactionReputationToFavorMult, this.favor);
    while(rep > 0) {
        if (rep >= reqdRep) {
            ++favorGain;
            rep -= reqdRep;
        } else {
            break;
        }
        reqdRep *= CONSTANTS.FactionReputationToFavorMult;
    }
    return [favorGain, rep];
}

//Adds all Augmentations to this faction.
Faction.prototype.addAllAugmentations = function() {
    this.augmentations.length = 0;
    for (var name in Augmentations) {
        if (Augmentations.hasOwnProperty(name)) {
            this.augmentations.push(name);
        }
    }
}

Faction.prototype.toJSON = function() {
	return Generic_toJSON("Faction", this);
}

Faction.fromJSON = function(value) {
	return Generic_fromJSON(Faction, value.data);
}

Reviver.constructors.Faction = Faction;

//Map of factions indexed by faction name
let Factions = {}

function loadFactions(saveString) {
    Factions = JSON.parse(saveString, Reviver);
}

function AddToFactions(faction) {
	var name = faction.name;
	Factions[name] = faction;
}

function factionExists(name) {
    return Factions.hasOwnProperty(name);
}

//TODO Augmentation price and rep requirement mult are 1 for everything right now,
//      This might change in the future for balance
function initFactions() {
	//Endgame
	var Illuminati = new Faction("Illuminati");
    Illuminati.setInfo(FactionInfo.IlluminatiInfo);
    resetFaction(Illuminati);

	var Daedalus = new Faction("Daedalus");
    Daedalus.setInfo(FactionInfo.DaedalusInfo);
    resetFaction(Daedalus);

	var Covenant = new Faction("The Covenant");
    Covenant.setInfo(FactionInfo.CovenantInfo);
    resetFaction(Covenant);

	//Megacorporations, each forms its own faction
	var ECorp = new Faction("ECorp");
    ECorp.setInfo(FactionInfo.ECorpInfo);
    resetFaction(ECorp);

	var MegaCorp = new Faction("MegaCorp");
    MegaCorp.setInfo(FactionInfo.MegaCorpInfo);
    resetFaction(MegaCorp);

	var BachmanAndAssociates = new Faction("Bachman & Associates");
    BachmanAndAssociates.setInfo(FactionInfo.BachmanAndAssociatesInfo);
    resetFaction(BachmanAndAssociates);

	var BladeIndustries = new Faction("Blade Industries");
    BladeIndustries.setInfo(FactionInfo.BladeIndustriesInfo);
    resetFaction(BladeIndustries);

	var NWO = new Faction("NWO");
    NWO.setInfo(FactionInfo.NWOInfo);
    resetFaction(NWO);

	var ClarkeIncorporated = new Faction("Clarke Incorporated");
    ClarkeIncorporated.setInfo(FactionInfo.ClarkeIncorporatedInfo);
    resetFaction(ClarkeIncorporated);

	var OmniTekIncorporated = new Faction("OmniTek Incorporated");
    OmniTekIncorporated.setInfo(FactionInfo.OmniTekIncorporatedInfo);
    resetFaction(OmniTekIncorporated);

	var FourSigma = new Faction("Four Sigma");
    FourSigma.setInfo(FactionInfo.FourSigmaInfo);
    resetFaction(FourSigma);

	var KuaiGongInternational = new Faction("KuaiGong International");
    KuaiGongInternational.setInfo(FactionInfo.KuaiGongInternationalInfo);
    resetFaction(KuaiGongInternational);

    //Other corporations
    var FulcrumTechnologies = new Faction("Fulcrum Secret Technologies");
    FulcrumTechnologies.setInfo(FactionInfo.FulcrumSecretTechnologiesInfo);
    resetFaction(FulcrumTechnologies);

	//Hacker groups
	var BitRunners = new Faction("BitRunners");
    BitRunners.setInfo(FactionInfo.BitRunnersInfo);
    resetFaction(BitRunners);

	var BlackHand = new Faction("The Black Hand");
    BlackHand.setInfo(FactionInfo.BlackHandInfo);
    resetFaction(BlackHand);

	var NiteSec = new Faction("NiteSec");
    NiteSec.setInfo(FactionInfo.NiteSecInfo);
    resetFaction(NiteSec);

	//City factions, essentially governments
	var Chongqing = new Faction("Chongqing");
    Chongqing.setInfo(FactionInfo.ChongqingInfo);
    resetFaction(Chongqing);

	var Sector12 = new Faction("Sector-12");
    Sector12.setInfo(FactionInfo.Sector12Info);
    resetFaction(Sector12);

	var NewTokyo = new Faction("New Tokyo");
    NewTokyo.setInfo(FactionInfo.NewTokyoInfo);
    resetFaction(NewTokyo);

	var Aevum = new Faction("Aevum");
    Aevum.setInfo(FactionInfo.AevumInfo);
    resetFaction(Aevum);

    var Ishima = new Faction("Ishima");
    Ishima.setInfo(FactionInfo.Ishima);
    resetFaction(Ishima);

	var Volhaven = new Faction("Volhaven");
    Volhaven.setInfo(FactionInfo.VolhavenInfo);
    resetFaction(Volhaven);

	//Criminal Organizations/Gangs
	var SpeakersForTheDead = new Faction("Speakers for the Dead");
    SpeakersForTheDead.setInfo(FactionInfo.SpeakersForTheDeadInfo);
    resetFaction(SpeakersForTheDead);

	var DarkArmy = new Faction("The Dark Army");
    DarkArmy.setInfo(FactionInfo.DarkArmyInfo);
    resetFaction(DarkArmy);

	var TheSyndicate = new Faction("The Syndicate");
    TheSyndicate.setInfo(FactionInfo.TheSyndicateInfo);
    resetFaction(TheSyndicate);

    var Silhouette = new Faction("Silhouette");
    Silhouette.setInfo(FactionInfo.SilhouetteInfo);
    resetFaction(Silhouette);

    var Tetrads = new Faction("Tetrads"); //Low-medium level asian crime gang
    Tetrads.setInfo(FactionInfo.TetradsInfo);
    resetFaction(Tetrads);

    var SlumSnakes = new Faction("Slum Snakes"); //Low level crime gang
    SlumSnakes.setInfo(FactionInfo.SlumSnakesInfo);
    resetFaction(SlumSnakes);

	//Earlygame factions - factions the player will prestige with early on that don't
	//belong in other categories
    var Netburners = new Faction("Netburners");
    Netburners.setInfo(FactionInfo.NetburnersInfo);
    resetFaction(Netburners);

	var TianDiHui = new Faction("Tian Di Hui");	//Society of the Heaven and Earth
    TianDiHui.setInfo(FactionInfo.TianDiHuiInfo);
    resetFaction(TianDiHui);

	var CyberSec = new Faction("CyberSec");
    CyberSec.setInfo(FactionInfo.CyberSecInfo);
    resetFaction(CyberSec);

    //Special Factions
    var Bladeburners = new Faction("Bladeburners");
    Bladeburners.setInfo(FactionInfo.BladeburnersInfo);
    resetFaction(Bladeburners);
}

//Resets a faction during (re-)initialization. Saves the favor in the new
//Faction object and deletes the old Faction Object from "Factions". Then
//reinserts the new Faction object
function resetFaction(newFactionObject) {
    if (!(newFactionObject instanceof Faction)) {
        throw new Error("Invalid argument 'newFactionObject' passed into resetFaction()");
    }
    var factionName = newFactionObject.name;
    if (factionExists(factionName)) {
        newFactionObject.favor = Factions[factionName].favor;
        delete Factions[factionName];
    }
    AddToFactions(newFactionObject);
}

function inviteToFaction(faction) {
    if (Settings.SuppressFactionInvites) {
        faction.alreadyInvited = true;
        Player.factionInvitations.push(faction.name);
        if (Engine.currentPage === Engine.Page.Factions) {
            Engine.loadFactionsContent();
        }
    } else {
        factionInvitationBoxCreate(faction);
    }
}

function joinFaction(faction) {
	faction.isMember = true;
    Player.factions.push(faction.name);

    //Determine what factions you are banned from now that you have joined this faction
    if (faction.name == "Chongqing") {
        Factions["Sector-12"].isBanned = true;
        Factions["Aevum"].isBanned = true;
        Factions["Volhaven"].isBanned = true;
    } else if (faction.name == "Sector-12") {
        Factions["Chongqing"].isBanned = true;
        Factions["New Tokyo"].isBanned = true;
        Factions["Ishima"].isBanned = true;
        Factions["Volhaven"].isBanned = true;
    } else if (faction.name == "New Tokyo") {
        Factions["Sector-12"].isBanned = true;
        Factions["Aevum"].isBanned = true;
        Factions["Volhaven"].isBanned = true;
    } else if (faction.name == "Aevum") {
        Factions["Chongqing"].isBanned = true;
        Factions["New Tokyo"].isBanned = true;
        Factions["Ishima"].isBanned = true;
        Factions["Volhaven"].isBanned = true;
    } else if (faction.name == "Ishima") {
        Factions["Sector-12"].isBanned = true;
        Factions["Aevum"].isBanned = true;
        Factions["Volhaven"].isBanned = true;
    } else if (faction.name == "Volhaven") {
        Factions["Chongqing"].isBanned = true;
        Factions["Sector-12"].isBanned = true;
        Factions["New Tokyo"].isBanned = true;
        Factions["Aevum"].isBanned = true;
        Factions["Ishima"].isBanned = true;
    }
}

//Displays the HTML content for a specific faction
function displayFactionContent(factionName) {
	var faction = Factions[factionName];
    if (faction == null) {
        throw new Error("Invalid factionName passed into displayFactionContent: " + factionName);
    }
    removeChildrenFromElement(Engine.Display.factionContent);
    var elements = [];

    //Header and faction info
    elements.push(createElement("h1", {
        innerText:factionName
    }));
    elements.push(createElement("pre", {
        innerHTML:"<i>" + faction.info + "</i>"
    }));
    elements.push(createElement("p", {
        innerText:"---------------",
    }));

    //Faction reputation and favor
    var favorGain = faction.getFavorGain();
    if (favorGain.length != 2) {favorGain = 0;}
    favorGain = favorGain[0];
    elements.push(createElement("p", {
        innerText: "Reputation: " + formatNumber(faction.playerReputation, 4),
        tooltip:"You will earn " + formatNumber(favorGain, 4) +
                " faction favor upon resetting after installing an Augmentation"
    }))
    elements.push(createElement("p", {
        innerText:"---------------",
    }));
    elements.push(createElement("p", {
        innerText:"Faction Favor: " + formatNumber(faction.favor, 4),
        tooltip:"Faction favor increases the rate at which " +
                "you earn reputation for this faction by 1% per favor. Faction favor " +
                "is gained whenever you reset after installing an Augmentation. The amount of " +
                "favor you gain depends on how much reputation you have with the faction"
    }));
    elements.push(createElement("p", {
        innerText:"---------------",
    }));

    //Faction Work Description Text
    elements.push(createElement("pre", {
        id:"faction-work-description-text",
        innerText:"Perform work/carry out assignments for your faction to help further its cause! By doing so " +
                  "you will earn reputation for your faction. You will also gain reputation passively over time, " +
                  "although at a very slow rate. Earning reputation will allow you to purchase Augmentations " +
                  "through this faction, which are powerful upgrades that enhance your abilities. Note that you cannot " +
		          "use your terminal or create scripts when you are performing a task!"
    }));
    elements.push(createElement("br"));

    //Hacking Mission Option
    var hackMissionDiv = createElement("div", {
        id:"faction-hack-mission-div", class:"faction-work-div",
    });
    var hackMissionDivWrapper = createElement("div", {class:"faction-work-div-wrapper"});
    hackMissionDiv.appendChild(hackMissionDivWrapper);
    hackMissionDivWrapper.appendChild(createElement("a", {
        class:"a-link-button", innerText:"Hacking Mission",
        clickListener:()=>{
            Engine.loadMissionContent();
            var mission = new HackingMission(faction.playerReputation, faction);
            setInMission(true, mission); //Sets inMission flag to true
            mission.init();
            return false;
        }
    }));
    hackMissionDivWrapper.appendChild(createElement("p", {
        innerText:"Attempt a hacking mission for your faction. " +
                  "A mission is a mini game that, if won, earns you " +
                  "significant reputation with this faction. (Recommended hacking level: 200+)"
    }));
    elements.push(hackMissionDiv);

    //Hacking Contracts Option
	var hackDiv = createElement("div", {
        id:"faction-hack-div", class:"faction-work-div",
    });
    var hackDivWrapper = createElement("div", {class:"faction-work-div-wrapper"});
    hackDiv.appendChild(hackDivWrapper);
    hackDivWrapper.appendChild(createElement("a", {
        class:"a-link-button", innerText:"Hacking Contracts",
        clickListener:()=>{
            Player.startFactionHackWork(faction);
            return false;
        }
    }));
    hackDivWrapper.appendChild(createElement("p", {
        innerText:"Complete hacking contracts for your faction. " +
                  "Your effectiveness, which determines how much " +
                  "reputation you gain for this faction, is based on your hacking skill. " +
                  "You will gain hacking exp."
    }));
    elements.push(hackDiv);

    //Field Work Option
	var fieldWorkDiv = createElement("div", {
        id:"faction-fieldwork-div", class:"faction-work-div"
    });
    var fieldWorkDivWrapper = createElement("div", {class:"faction-work-div-wrapper"});
    fieldWorkDiv.appendChild(fieldWorkDivWrapper);
    fieldWorkDivWrapper.appendChild(createElement("a", {
        class:"a-link-button", innerText:"Field Work",
        clickListener:()=>{
            Player.startFactionFieldWork(faction);
            return false;
        }
    }));
    fieldWorkDivWrapper.appendChild(createElement("p", {
        innerText:"Carry out field missions for your faction. " +
                  "Your effectiveness, which determines how much " +
                  "reputation you gain for this faction, is based on all of your stats. " +
                  "You will gain exp for all stats."
    }));
    elements.push(fieldWorkDiv);

    //Security Work Option
	var securityWorkDiv = createElement("div", {
        id:"faction-securitywork-div", class:"faction-work-div"
    });
    var securityWorkDivWrapper = createElement("div", {class:"faction-work-div-wrapper"});
    securityWorkDiv.appendChild(securityWorkDivWrapper);
    securityWorkDivWrapper.appendChild(createElement("a", {
        class:"a-link-button", innerText:"Security Work",
        clickListener:()=>{
            Player.startFactionSecurityWork(faction);
            return false;
        }
    }));
    securityWorkDivWrapper.appendChild(createElement("p", {
        innerText:"Serve in a security detail for your faction. " +
                  "Your effectiveness, which determines how much " +
                  "reputation you gain for this faction, is based on your combat stats. " +
                  "You will gain exp for all combat stats."
    }));
    elements.push(securityWorkDiv);

    //Donate for reputation
    var donateDiv = createElement("div", {
        id:"faction-donate-div", class:"faction-work-div"
    });
    var donateDivWrapper = createElement("div", {class:"faction-work-div-wrapper"});
    donateDiv.appendChild(donateDivWrapper);
    var donateRepGain = createElement("p", {
        innerText:"This donation will result in 0 reputation gain"
    });
    var donateAmountInput = createElement("input", {
        placeholder:"Donation amount",
        inputListener:()=>{
            var amt = parseFloat(donateAmountInput.value);
            if (isNaN(amt) || amt < 0) {
                donateRepGain.innerText = "Invalid donate amount entered!";
            } else {
                var repGain = amt / 1e6 * Player.faction_rep_mult;
                donateRepGain.innerText = "This donation will result in " +
                                          formatNumber(repGain, 3) + " reputation gain";
            }
        },
    });
    donateDivWrapper.appendChild(createElement("a", {
        class:"a-link-button", innerText:"Donate Money",
        clickListener:()=>{
            var amt = parseFloat(donateAmountInput.value);
            if (isNaN(amt) || amt < 0) {
                dialogBoxCreate("Invalid amount entered!");
            } else if (Player.money.lt(amt)) {
                dialogBoxCreate("You cannot afford to donate this much money!");
            } else {
                Player.loseMoney(amt);
                var repGain = amt / 1e6 * Player.faction_rep_mult;
                faction.playerReputation += repGain;
                dialogBoxCreate("You just donated " + numeral(amt).format("$0.000a") + " to " +
                                faction.name + " to gain " + formatNumber(repGain, 3) + " reputation");
                displayFactionContent(factionName);
            }
        }
    }));
    donateDivWrapper.appendChild(donateAmountInput);
    donateDivWrapper.appendChild(donateRepGain);
    elements.push(donateDiv);

    //Purchase Augmentations
    elements.push(createElement("pre", {
        innerHTML: "<br>As your reputation with this faction rises, you will " +
                   "unlock Augmentations, which you can purchase to enhance " +
                   "your abilities.<br><br>"
    }));
    elements.push(createElement("a", {
        class:"a-link-button", innerText:"Purchase Augmentations",
        clickListener:()=>{
            Engine.hideAllContent();
            Engine.Display.factionAugmentationsContent.style.display = "block";


            displayFactionAugmentations(factionName);
            return false;
        }
    }));

    //Gang (BitNode-2)
    if (Player.bitNodeN == 2 && (factionName == "Slum Snakes" || factionName == "Tetrads" ||
        factionName == "The Syndicate" || factionName == "The Dark Army" || factionName == "Speakers for the Dead" ||
        factionName == "NiteSec" || factionName == "The Black Hand")) {
        //Set everything else to invisible
        hackMissionDiv.style.display = "none";
        hackDiv.style.display = "none";
        fieldWorkDiv.style.display = "none";
        securityWorkDiv.style.display = "none";
        donateDiv.style.display = "none";

        //Create the 'Manage Gang' button
        var gangDiv = createElement("div", {
            id:"faction-gang-div", class:"faction-work-div", display:"inline"
        });
        var gangDivWrapper = createElement("div", {class:"faction-work-div-wrapper"});
        gangDiv.appendChild(gangDivWrapper);
        gangDivWrapper.appendChild(createElement("a", {
            class:"a-link-button", innerText:"Manage Gang",
            clickListener:()=>{
                if (!Player.inGang()) {
                    var yesBtn = yesNoBoxGetYesButton(), noBtn = yesNoBoxGetNoButton();
                    yesBtn.innerHTML = "Create Gang";
                    noBtn.innerHTML = "Cancel";
                    yesBtn.addEventListener("click", () => {
                        var hacking = false;
                        if (factionName === "NiteSec" || factionName === "The Black Hand") {hacking = true;}
                        Player.startGang(factionName, hacking);
                        Engine.loadGangContent();
                        yesNoBoxClose();
                    });
                    noBtn.addEventListener("click", () => {
                        yesNoBoxClose();
                    });
                    yesNoBoxCreate("Would you like to create a new Gang with " + factionName + "?<br><br>" +
                                   "Note that this will prevent you from creating a Gang with any other Faction until " +
                                   "this BitNode is destroyed. There are NO differences between the Factions you can " +
                                   "create a Gang with and each of these Factions have all Augmentations available");
                } else {
                    Engine.loadGangContent();
                }
            }
        }));
        gangDivWrapper.appendChild(createElement("p", {
            innerText:"Create and manage a gang for this Faction. " +
                      "Gangs will earn you money and faction reputation."
        }));
        //Manage Gang button goes before Faction work stuff
        elements.splice(7, 1, gangDiv);

        if (Player.inGang() && Player.gang.facName != factionName) {
            //If the player has a gang but its not for this faction
            gangDiv.style.display = "none";
        }
        //Display all elements
        for (var i = 0; i < elements.length; ++i) {
            Engine.Display.factionContent.appendChild(elements[i]);
        }
        return;
    }

	if (faction.isMember) {
        if (faction.favor >= (150 * BitNodeMultipliers.RepToDonateToFaction)) {
            donateDiv.style.display = "inline";
        } else {
            donateDiv.style.display = "none";
        }

		switch(faction.name) {
			case "Illuminati":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "none";
				break;
			case "Daedalus":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "none";
				break;
			case "The Covenant":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "none";
				break;
			case "ECorp":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "MegaCorp":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "Bachman & Associates":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "Blade Industries":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "NWO":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "Clarke Incorporated":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "OmniTek Incorporated":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "Four Sigma":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "KuaiGong International":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
            case "Fulcrum Secret Technologies":
                hackMissionDiv.style.display = "inline";
                hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "none";
				securityWorkDiv.style.display = "inline";
                break;
			case "BitRunners":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "none";
				securityWorkDiv.style.display = "none";
				break;
			case "The Black Hand":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "none";
				break;
			case "NiteSec":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "none";
				securityWorkDiv.style.display = "none";
				break;
			case "Chongqing":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "Sector-12":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "New Tokyo":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "Aevum":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "Ishima":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "Volhaven":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "Speakers for the Dead":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
			case "The Dark Army":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "none";
				break;
			case "The Syndicate":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "inline";
				securityWorkDiv.style.display = "inline";
				break;
            case "Silhouette":
                hackMissionDiv.style.display = "inline";
                hackDiv.style.display = "inline";
                fieldWorkDiv.style.display = "inline";
                securityWorkDiv.style.display = "none";
                break;
            case "Tetrads":
                hackMissionDiv.style.display = "none";
                hackDiv.style.display = "none";
                fieldWorkDiv.style.display = "inline";
                securityWorkDiv.style.display = "inline";
                break;
            case "Slum Snakes":
                hackMissionDiv.style.display = "none";
                hackDiv.style.display = "none";
                fieldWorkDiv.style.display = "inline";
                securityWorkDiv.style.display = "inline";
                break;
            case "Netburners":
                hackMissionDiv.style.display = "inline";
                hackDiv.style.display = "inline";
                fieldWorkDiv.style.display = "none";
                securityWorkDiv.style.display = "none";
                break;
			case "Tian Di Hui":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "none";
				securityWorkDiv.style.display = "inline";
				break;
			case "CyberSec":
                hackMissionDiv.style.display = "inline";
				hackDiv.style.display = "inline";
				fieldWorkDiv.style.display = "none";
				securityWorkDiv.style.display = "none";
				break;
            case "Bladeburners":
                hackMissionDiv.style.display = "none";
                hackDiv.style.display = "none";
                fieldWorkDiv.style.display = "none";
                securityWorkDiv.style.display = "none";
                break;
			default:
				console.log("Faction does not exist");
				break;
		}
	} else {
		throw new Error("Not a member of this faction, cannot display faction information");
	}

    //Display all elements
    for (var i = 0; i < elements.length; ++i) {
        Engine.Display.factionContent.appendChild(elements[i]);
    }
}

var confirmingPurchases = true;
var sortOption = null;
function displayFactionAugmentations(factionName) {
    var faction = Factions[factionName];
    if (faction == null) {
        throw new Error("Could not find faction " + factionName + " in displayFactionAugmentations");
    }

    removeChildrenFromElement(Engine.Display.factionAugmentationsContent);
    var elements = [];

    //Back button
    elements.push(createElement("a", {
        innerText:"Back", class:"a-link-button",
        clickListener:()=>{
            Engine.loadFactionContent();
            displayFactionContent(factionName);
            return false;
        }
    }));

    //Header text
    elements.push(createElement("h1", {innerText:"Faction Augmentations"}));
    elements.push(createElement("p", {
        id:"faction-augmentations-page-desc",
        innerHTML:"Lists all Augmentations that are available to purchase from " + factionName + "<br><br>" +
                  "Augmentations are powerful upgrades that will enhance your abilities."
    }));

    //Confirming not confirming button
    elements.push(createElement("label", {
        for:"faction-augmentations-confirming-checkbox",innerText:"Confirm Purchases",
        color:"white", margin:"4px", padding:"4px",
    }));
    var confirmingPurchasesCheckbox = createElement("input", {
        type:"checkbox", id:"faction-augmentations-confirming-checkbox", checked:confirmingPurchases,
        margin:"4px", padding:"4px",
        clickListener:()=>{
            confirmingPurchases = confirmingPurchasesCheckbox.checked;
        }
    });
    elements.push(confirmingPurchasesCheckbox);
    elements.push(createElement("br"));
    elements.push(createElement("br"));

    //Augmentations List
    var augmentationsList = createElement("ul");

    //Sort buttons
    var sortByCostBtn = createElement("a", {
        innerText:"Sort by Cost", class:"a-link-button",
        clickListener:()=>{
            sortOption = "cost";
            var augs = faction.augmentations.slice();
            augs.sort((augName1, augName2)=>{
                var aug1 = Augmentations[augName1], aug2 = Augmentations[augName2];
                if (aug1 == null || aug2 == null) {
                    throw new Error("Invalid Augmentation Names");
                }
                return aug1.baseCost - aug2.baseCost;
            });
            removeChildrenFromElement(augmentationsList);
            createFactionAugmentationDisplayElements(augmentationsList, augs, faction);
        }
    });
    var sortByRepBtn = createElement("a", {
        innerText:"Sort by Reputation", class:"a-link-button",
        clickListener:()=>{
            sortOption = "reputation";
            var augs = faction.augmentations.slice();
            augs.sort((augName1, augName2)=>{
                var aug1 = Augmentations[augName1], aug2 = Augmentations[augName2];
                if (aug1 == null || aug2 == null) {
                    throw new Error("Invalid Augmentation Names");
                }
                return aug1.baseRepRequirement - aug2.baseRepRequirement;
            });
            removeChildrenFromElement(augmentationsList);
            createFactionAugmentationDisplayElements(augmentationsList, augs, faction);
        }
    });
    var defaultSortBtn = createElement("a", {
        innerText:"Sort by Default Order", class:"a-link-button",
        clickListener:()=>{
            sortOption = "default";
            removeChildrenFromElement(augmentationsList);
            createFactionAugmentationDisplayElements(augmentationsList, faction.augmentations, faction);
        }
    });
    elements.push(sortByCostBtn);
    elements.push(sortByRepBtn);
    elements.push(defaultSortBtn);
    switch(sortOption) {
        case "cost":
            sortByCostBtn.click();
            break;
        case "reputation":
            sortByRepBtn.click();
            break;
        default:
            defaultSortBtn.click();
            break;
    }

    elements.push(augmentationsList);

    for (var i = 0; i < elements.length; ++i) {
        Engine.Display.factionAugmentationsContent.appendChild(elements[i]);
    }
}

//Takes in an array of Augmentation Names, constructs DOM elements
//to list them on the faction page, and appends them to the given
//DOM element
//  @augmentationsList DOM List to append Aug DOM elements to
//  @augs Array of Aug names
//  @faction Faction for which to display Augmentations
function createFactionAugmentationDisplayElements(augmentationsList, augs, faction) {
    for (var i = 0; i < augs.length; ++i) {
        (function () {
            var aug = Augmentations[augs[i]];
            if (aug == null) {
                throw new Error("Invalid Augmentation when trying to create Augmentation display Elements");
            }
            var owned = false;
            for (var j = 0; j < Player.queuedAugmentations.length; ++j) {
                if (Player.queuedAugmentations[j].name == aug.name) {
                    owned = true;
                    break;
                }
            }
            for (var j = 0; j < Player.augmentations.length; ++j) {
                if (Player.augmentations[j].name == aug.name) {
                    owned = true;
                    break;
                }
            }

            var item = createElement("li");
            var span = createElement("span", {display:"inline-block"});
            var aDiv = createElement("div", {tooltip:aug.info});
            var aElem = createElement("a", {
                innerText:aug.name, display:"inline",
                clickListener:()=>{
                    if (confirmingPurchases) {
                        purchaseAugmentationBoxCreate(aug, faction);
                    } else {
                        purchaseAugmentation(aug, faction);
                    }
                    return false;
                }
            });
            if (aug.name == AugmentationNames.NeuroFluxGovernor) {
                aElem.innerText += " - Level " + (getNextNeurofluxLevel());
            }
            var pElem = createElement("p", {
                display:"inline",
            })
            var req = aug.baseRepRequirement * faction.augmentationRepRequirementMult;
            var hasPrereqs = hasAugmentationPrereqs(aug);
            if (!hasPrereqs) {
                aElem.setAttribute("class", "a-link-button-inactive");
                pElem.innerHTML = "LOCKED (Requires " + aug.prereqs.join(",") + " as prerequisite(s))";
                pElem.style.color = "red";
            } else if (aug.name != AugmentationNames.NeuroFluxGovernor && (aug.owned || owned)) {
                aElem.setAttribute("class", "a-link-button-inactive");
                pElem.innerHTML = "ALREADY OWNED";
            } else if (faction.playerReputation >= req) {
                aElem.setAttribute("class", "a-link-button");
                pElem.innerHTML = "UNLOCKED - " + numeral(aug.baseCost * faction.augmentationPriceMult).format("$0.000a");
            } else {
                aElem.setAttribute("class", "a-link-button-inactive");
                pElem.innerHTML = "LOCKED (Requires " + formatNumber(req, 1) + " faction reputation) - " + numeral(aug.baseCost * faction.augmentationPriceMult).format("$0.000a");
                pElem.style.color = "red";
            }
            aDiv.appendChild(aElem);
            span.appendChild(aDiv);
            span.appendChild(pElem);
            item.appendChild(span);
            augmentationsList.appendChild(item);
        }()); //Immediate invocation closure
    }
}

function purchaseAugmentationBoxCreate(aug, fac) {
    var yesBtn = yesNoBoxGetYesButton(), noBtn = yesNoBoxGetNoButton();
    yesBtn.innerHTML = "Purchase";
    noBtn.innerHTML = "Cancel";
    yesBtn.addEventListener("click", function() {
        purchaseAugmentation(aug, fac);
    });
    noBtn.addEventListener("click", function() {
        yesNoBoxClose();
    });

    yesNoBoxCreate("<h2>" + aug.name + "</h2><br>" +
                   aug.info + "<br><br>" +
                   "<br>Would you like to purchase the " + aug.name + " Augmentation for $" +
                   formatNumber(aug.baseCost * fac.augmentationPriceMult, 2)  + "?");
}

//Returns a boolean indicating whether the player has the prerequisites for the
//specified Augmentation
function hasAugmentationPrereqs(aug) {
    var hasPrereqs = true;
    if (aug.prereqs && aug.prereqs.length > 0) {
        for (var i = 0; i < aug.prereqs.length; ++i) {
            var prereqAug = Augmentations[aug.prereqs[i]];
            if (prereqAug == null) {
                console.log("ERROR: Invalid prereq Augmentation: " + aug.prereqs[i]);
                continue;
            }
            if (prereqAug.owned === false) {
                hasPrereqs = false;

                //Check if the aug is purchased
                for (var j = 0; j < Player.queuedAugmentations.length; ++j) {
                    if (Player.queuedAugmentations[j].name === prereqAug.name) {
                        hasPrereqs = true;
                        break;
                    }
                }
            }
        }
    }
    return hasPrereqs;
}

function purchaseAugmentation(aug, fac, sing=false) {
    var hasPrereqs = hasAugmentationPrereqs(aug);
    if (!hasPrereqs) {
        var txt = "You must first purchase or install " + aug.prereqs.join(",") + " before you can " +
                  "purchase this one.";
        if (sing) {return txt;} else {dialogBoxCreate(txt);}
    } else if (Player.money.lt(aug.baseCost * fac.augmentationPriceMult)) {
        let txt = "You don't have enough money to purchase " + aug.name;
        if (sing) {return txt;}
        dialogBoxCreate(txt);
    } else if (fac.playerReputation < aug.baseRepRequirement) {
        let txt = "You don't have enough faction reputation to purchase " + aug.name;
        if (sing) {return txt;}
        dialogBoxCreate(txt);
    } else if (Player.money.gte(aug.baseCost * fac.augmentationPriceMult)) {
        if (Player.firstAugPurchased === false) {
            Player.firstAugPurchased = true;
            document.getElementById("augmentations-tab").style.display = "list-item";
            document.getElementById("character-menu-header").click();
            document.getElementById("character-menu-header").click();
        }

        var queuedAugmentation = new PlayerOwnedAugmentation(aug.name);
        if (aug.name == AugmentationNames.NeuroFluxGovernor) {
            queuedAugmentation.level = getNextNeurofluxLevel();
        }
        Player.queuedAugmentations.push(queuedAugmentation);

        Player.loseMoney((aug.baseCost * fac.augmentationPriceMult));

        //If you just purchased Neuroflux Governor, recalculate the cost
        if (aug.name == AugmentationNames.NeuroFluxGovernor) {
            var nextLevel = getNextNeurofluxLevel();
            --nextLevel;
            var mult = Math.pow(CONSTANTS.NeuroFluxGovernorLevelMult, nextLevel);
            aug.baseRepRequirement = 500 * mult * CONSTANTS.AugmentationRepMultiplier * BitNodeMultipliers.AugmentationRepCost;
            aug.baseCost = 750e3 * mult * CONSTANTS.AugmentationCostMultiplier * BitNodeMultipliers.AugmentationMoneyCost;

            for (var i = 0; i < Player.queuedAugmentations.length-1; ++i) {
                aug.baseCost *= CONSTANTS.MultipleAugMultiplier;
            }
        }

        for (var name in Augmentations) {
            if (Augmentations.hasOwnProperty(name)) {
                Augmentations[name].baseCost *= CONSTANTS.MultipleAugMultiplier;
            }
        }

        if (sing) {
            return "You purchased " + aug.name;
        } else {
            dialogBoxCreate("You purchased "  + aug.name + ". It's enhancements will not take " +
                            "effect until they are installed. To install your augmentations, go to the " +
                            "'Augmentations' tab on the left-hand navigation menu. Purchasing additional " +
                            "augmentations will now be more expensive.");
        }

        displayFactionAugmentations(fac.name);
    } else {
        dialogBoxCreate("Hmm, something went wrong when trying to purchase an Augmentation. " +
                        "Please report this to the game developer with an explanation of how to " +
                        "reproduce this.");
    }
    yesNoBoxClose();
}

function getNextNeurofluxLevel() {
    var aug = Augmentations[AugmentationNames.NeuroFluxGovernor];
    if (aug == null) {
        for (var i = 0; i < Player.augmentations.length; ++i) {
            if (Player.augmentations[i].name == AugmentationNames.NeuroFluxGovernor) {
                aug = Player.augmentations[i];
            }
        }
        if (aug == null) {
            console.log("WARNING: Could not find NeuroFlux Governor aug. This is OK if " +
                        "it happens during the loading/initialization of the game, but probably " +
                        "indicates something seriously wrong at other times");
            return 1;
        }
    }
    var nextLevel = aug.level + 1;
    for (var i = 0; i < Player.queuedAugmentations.length; ++i) {
        if (Player.queuedAugmentations[i].name == AugmentationNames.NeuroFluxGovernor) {
            ++nextLevel;
        }
    }
    return nextLevel;
}

function processPassiveFactionRepGain(numCycles) {
    var numTimesGain = (numCycles / 600) * Player.faction_rep_mult;
    for (var name in Factions) {
		if (Factions.hasOwnProperty(name)) {
			var faction = Factions[name];

			//TODO Get hard value of 1 rep per "rep gain cycle"" for now..
            //maybe later make this based on
            //a player's 'status' like how powerful they are and how much money they have
            if (faction.isMember) {faction.playerReputation += (numTimesGain * BitNodeMultipliers.FactionPassiveRepGain);}
		}
	}
}

export {getNextNeurofluxLevel, Factions, initFactions, inviteToFaction,
        joinFaction, displayFactionContent, processPassiveFactionRepGain,
        loadFactions, Faction, purchaseAugmentation, factionExists};
