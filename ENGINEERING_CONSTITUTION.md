# Engineering Constitution

**Status:** TOP-LEVEL / MANDATORY  
**Scope:** alle architectuur, softwareontwikkeling, data-modellen, infrastructuur, agents, workflows, refactors, reviews en technische besluitvorming.

Deze principes zijn geen aanbevelingen. Ze zijn de standaard waartegen iedere technische keuze wordt beoordeeld.

## 1. Solid but simple

Bouw oplossingen die robuust, begrijpelijk en onderhoudbaar zijn, maar niet complexer dan noodzakelijk.

Een oplossing is beter wanneer zij hetzelfde probleem oplost met:

- minder componenten;
- minder abstractielagen;
- minder dependencies;
- minder configuratie;
- minder operationele belasting;
- minder impliciet gedrag;
- een kleiner failure surface.

**Simple betekent niet primitief. Solid betekent niet complex.**

De gewenste toestand is: **de eenvoudigste oplossing die aantoonbaar robuust genoeg is.**

---

## 2. No overengineering allowed

Overengineering is een **design failure**.

Niet bouwen voor theoretische toekomstige requirements zonder concrete noodzaak.

Niet automatisch toevoegen:

- microservices;
- message queues;
- event buses;
- extra databases;
- extra state stores;
- generic abstraction frameworks;
- plugin-systemen;
- uitgebreide orchestration;
- premature scaling;
- custom frameworks;
- configuratielagen;
- extra deployment tiers;

wanneer een eenvoudiger oplossing het huidige probleem betrouwbaar oplost.

### Verplichte toets

Voor iedere significante toevoeging:

> Welk concreet huidig probleem lost dit op?

Als daarop geen scherp antwoord bestaat, wordt de toevoeging niet gebouwd.

---

## 3. First-principles thinking

Begin niet bij:

> Welke technologie kunnen we hiervoor gebruiken?

Begin bij:

> Welk fundamenteel probleem moeten we oplossen?

Voor iedere belangrijke beslissing:

1. Definieer het werkelijke probleem.
2. Scheid harde eisen van aannames.
3. Verwijder historische of toevallige beperkingen.
4. Zoek de kleinste noodzakelijke capability.
5. Ontwerp vanuit die capability.
6. Kies daarna pas technologie.

Architectuur volgt uit requirements — niet andersom.

---

## 4. Do not reinvent the wheel

Gebruik bestaande, bewezen oplossingen wanneer die het probleem goed oplossen.

Voorkeursvolgorde:

1. bestaande standaard;
2. bestaande platformfunctionaliteit;
3. bewezen library/tool;
4. bewezen architectuurpatroon;
5. eenvoudige eigen implementatie;
6. pas als laatste een nieuw framework of systeem ontwerpen.

Custom development moet aantoonbare meerwaarde hebben.

**“Wij kunnen het zelf bouwen” is geen argument om het zelf te bouwen.**

Beoordeel bestaande oplossingen op:

- maturity;
- simplicity;
- security;
- maintainability;
- adoption;
- documentation;
- vendor/platform risk;
- total operational cost.

---

## 5. Be your own biggest critic

Iedere oplossing moet actief worden aangevallen voordat zij wordt geaccepteerd.

Verplichte interne vragen:

- Is dit werkelijk nodig?
- Kan dit eenvoudiger?
- Welke aanname kan fout zijn?
- Wat is het zwakste onderdeel?
- Welke failure mode missen we?
- Hebben we een probleem opgelost dat niet bestaat?
- Bestaat hiervoor al een bewezen oplossing?
- Introduceren we meer complexiteit dan waarde?
- Zou een ervaren engineer dit over zes maanden nog logisch vinden?
- Kunnen we iets verwijderen zonder functionaliteit te verliezen?

De eerste oplossing is een kandidaat, geen conclusie.

Feedback uit bugs, incidenten, reviews en productiegedrag moet worden gebruikt om volgende beslissingen beter te maken.

---

# Decision hierarchy

Bij technische keuzes geldt:

**1. Correctness & noodzakelijke security/safety/compliance**  
↓  
**2. Deze Engineering Constitution**  
↓  
**3. Concrete functionele requirements**  
↓  
**4. Maintainability & operational simplicity**  
↓  
**5. Performance/scalability voor zover daadwerkelijk nodig**  
↓  
**6. Elegantie, novelty en technische voorkeur**

Novelty staat bewust onderaan.

---

# Default engineering bias

Wanneer twee oplossingen functioneel gelijkwaardig zijn:

**kies degene met minder moving parts.**

Wanneer een bestaand platform een capability betrouwbaar levert:

**gebruik die capability.**

Wanneer een abstractie maar één implementatie heeft:

**maak niet automatisch een abstractielaag.**

Wanneer toekomstige schaal theoretisch is:

**optimaliseer niet voor die schaal.**

Wanneer een probleem later eenvoudig oplosbaar is:

**los het niet vandaag op.**

Wanneer verwijderen mogelijk is:

**prefer deletion over addition.**

---

# Mandatory design review

Voor iedere materiële architectuur- of implementatiekeuze moet minimaal worden vastgesteld:

### Problem

Welk concreet probleem lossen we op?

### Hard requirements

Wat moet werkelijk waar zijn?

### Simplest viable solution

Wat is de eenvoudigste robuuste oplossing?

### Existing solution

Bestaat hiervoor al bewezen technologie of platformfunctionaliteit?

### Added complexity

Welke nieuwe moving parts introduceren we?

### Failure modes

Wat kan hierdoor fout gaan?

### Reversibility

Hoe moeilijk is deze beslissing later terug te draaien?

### Verdict

Waarom is deze oplossing eenvoudiger of beter dan de alternatieven?

Als deze vragen geen overtuigend antwoord opleveren, wordt niet gebouwd.

---

# PR / implementation gate

Een wijziging mag niet uitsluitend worden beoordeeld op:

> Werkt het?

Ook moet worden beoordeeld:

- Is het nodig?
- Is het de eenvoudigste goede oplossing?
- Dupliceert het bestaande functionaliteit?
- Introduceert het onnodige state?
- Introduceert het onnodige dependencies?
- Introduceert het premature abstraction?
- Verhoogt het de operationele burden?
- Kan er code/configuratie worden verwijderd?
- Zijn foutscenario's voldoende afgedekt?

### Hard rejection conditions

Een ontwerp of PR wordt teruggestuurd wanneer:

- complexiteit niet wordt gerechtvaardigd;
- een bestaande bewezen oplossing zonder goede reden opnieuw wordt gebouwd;
- abstracties worden toegevoegd voor hypothetisch toekomstgebruik;
- infrastructurele componenten worden toegevoegd zonder concrete requirement;
- dezelfde functionaliteit eenvoudiger gerealiseerd kan worden;
- onderhouds- of operationele kosten disproportioneel toenemen.

---

# Architectural principle

De standaardarchitectuur is:

> **Monolith first, platform capabilities first, explicit interfaces, minimal state, minimal dependencies, boring technology where possible.**

Opsplitsen gebeurt alleen wanneer aantoonbare grenzen ontstaan door bijvoorbeeld:

- isolation;
- security;
- independent scaling;
- ownership;
- deployment;
- reliability;

en niet omdat opsplitsen architectonisch aantrekkelijk lijkt.

---

# Continuous improvement

Na relevante bugs, incidenten of mislukte ontwerpen stellen we niet alleen vast:

> Wat ging fout?

Maar ook:

> Welke aanname, ontwerpkeuze of beslisregel maakte deze fout mogelijk?

Waar nuttig wordt de onderliggende engineeringregel verbeterd zodat dezelfde klasse fout minder waarschijnlijk opnieuw ontstaat.

Recursive learning betekent daarmee:

**incident → oorzaak → ontwerpprincipe → verbeterde toekomstige beslissing.**

Niet:

**incident → extra laag → extra systeem → extra complexiteit.**

---

# Final rule

Wanneer twijfel bestaat tussen:

**meer sophistication**  
en  
**minder complexiteit met voldoende robuustheid**

is de default:

# LESS, BUT BETTER.
