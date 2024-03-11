## Accounts Migration
 - [x] Gmail account
	 -  `bibliotools.neuro@gmail.com` / `semantic2024`
	 - [x] change security email from bhar... to jacob...ico
 - [x] Github account
	 -  `residencytools` / `semantic2024`
	 -  Organization for this particular bibliometric tool for neurosurgery : `biblio-neuro` 
	 -  [ ] Github 2-factor Authentication configuration before April 9th, 2024
 - [x] Frontend code
	 - `https://github.com/biblio-neuro/biblio-neuro.github.io`  - NOTE: `biblio-neuro` is an organization under the user `residencytools`. For e.g, in future, if one comes up with another tool/product for some other use case or some other program, a new org. can be created under the same user `residencytools` 
 - [x] Frontend GH hosting
	 - Frontend hosted at : https://biblio-neuro.github.io/
 - [ ] Google Sheets 
	 - [x] API Key
		 - To access any of the google products from backend, in our case Google Sheets, you need an API Key to make the requests. Every gmail account has a corresponding Google Cloud account. So, with the gmail account described above, on https://console.cloud.google.com ,a new App "NeuroSurgery" is created, and one `API Key` has been created. This key can be used for any new tools for the organization `neurosurgery` 
		 - Then, under the App/Project "NeuroSurgery" created above, choose "ENABLE APIS AND SERVICES" -> search for GOOGLE SHEETS API and enable it. Now this Api Key can be used to access google sheets with proper permissions and Sheet IDs
		 - `AIzaSyCoyqJBy_f4yB60iMvzUYdITJ53T2yIAQI`
	 - [ ] Sheet IDs
		 - [ ] Program Details 
		 - [ ] Individuals Data
 - [ ] Download Backend code from Glitch
	 - [x] Download the working version from current glitch.com hosting (Bhargav's account)
	 - [x] Upload as a new repository on github under the `residencytools` account, probably under the `biblio-neuro` account. _Some notes on the backend code repository:_
		 - At this point, glitch accepts a github repository as the reference code for a backend project.
		 - Once a glitch project is created using a github repository, any code changes that one makes on the glitch code where the backend is running, they won't reflect in the Github repository.
		 - Likewise, if a desired change is implemented is made in the github repository of the backend code, it doesn't automatically reflect in the glitch project. Even doing a `git pull` did not update the glitch project.
		 - Some `dirty` ways to get around this problem are :
			 - If it is a one-off change made on the glitch code that is already running, make the corresponding code change on the github project and commit it.
			 - If many files have been changed on the glitch project that's running, just download the whole project from glitch, commit the changes to the existing Github repository
			 - Or, say new changes have been implemented in the local development environment and the Github repository of the backend code has been updated, import it as a new project on glitch.com. **Note: Then the hosting url of backend on glitch changes, should be updated on the frontend accordingly
 - [x] Glitch with new github, backend host