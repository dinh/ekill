/**
Display the number of times the user has killed an element on the page, and also to display a badge when there are new changes in the extension.
**/
(c => {
  c.browserAction.setBadgeBackgroundColor({ color: "#000000" });

  c.storage.sync.get({
    "ekillVersion": {
      shownChangesFor: "0.0"
    },
    "ekillSettings": {
      holdsGrudge: "false"
    }
  }, item => {
    if (c.runtime.lastError) { // c.runtime.lastError is a property that returns the last error that occurred in an asynchronous function call.
        if (c.runtime.lastError) {
            console.error(c.runtime.lastError);
        } else {
            let ekillVersion = item.ekillVersion;
            let ekillSettings = item.ekillSettings;
            // This is a function that compares two version numbers and returns true if the first one is newer than the second. 
            // It's used to determine whether or not to display a badge on the extension icon indicating that there are new changes in this version of the extension.
            let showChanges = ekill.isNewerVersion(
                c.runtime.getManifest()
                .version,
                ekillVersion.shownChangesFor);
            if (showChanges) {
                c.browserAction.setBadgeText({
                    text: "New"
                });
            }
            // This is a listener that listens for the browser action to be clicked. 
            // When it is, it will either open up a new tab with the changelog or send a message to toggle the extension on/off.
            c.browserAction.onClicked.addListener(tab => {
                if (showChanges) {
                    c.tabs.create({
                        url: c.extension.getURL("changelog.html")
                    });
                    showChanges = false;
                    c.browserAction.setBadgeText({
                        text: ""
                    });
                } else {
                    c.tabs.sendMessage(tab.id, "toggle");
                }
            });
            // This is a function that updates the badge on the extension icon. 
            // It will either display the number of times you've killed an element, or it will clear the badge. 
            // The badge is cleared when you reload a page or switch to another tab.
            if (ekillSettings.holdsGrudge === "true" && !showChanges) {
                // This is a function that updates the kill counter on the extension icon. 
                // It takes in a tabId and sends a message to the content script with that id, asking for the current kill count. 
                // If there is no error, it will either clear or update the badge text based on whether or not there are kills.
                let updateKillCounter = tabId => {
                    c.tabs.sendMessage(tabId, "queryKillCount", {}, response => {
                        if (c.runtime.lastError) {
                            console.error(c.runtime.lastError);
                        } else {
                            if (response === undefined || response === 0) {
                                c.browserAction.setBadgeText({
                                    text: ""
                                });
                            } else {
                                c.browserAction.setBadgeText({
                                    text: response.toString()
                                });
                            }
                        }
                    });
                }
                // Check if a kill count was set when switching to a tab, and either
                // clear the badge or re-display the count
                c.tabs.onActivated.addListener((activeInfo) => {
                    updateKillCounter(activeInfo.tabId);
                });
                let msgHandler = (message, sender, sendResponse) => {
                    if (message === "killCountUpdated") {
                        updateKillCounter(sender.tab.id);
                    } else if (message === "pageLoading") {
                        // Clear badge on page reloads
                        c.browserAction.setBadgeText({
                            text: ""
                        });
                    }
                };
                c.runtime.onMessage.addListener(msgHandler);
            }
        }
      console.error(c.runtime.lastError);
    } else {
      let ekillVersion = item.ekillVersion;
      let ekillSettings = item.ekillSettings;

      let showChanges = ekill.isNewerVersion(
        c.runtime.getManifest().version,
        ekillVersion.shownChangesFor);

      if (showChanges) {
        c.browserAction.setBadgeText({text: "New"});
      }

      c.browserAction.onClicked.addListener(tab => {
        if (showChanges) {
          c.tabs.create({ url: c.extension.getURL("changelog.html") });

          showChanges = false;
          c.browserAction.setBadgeText({text: ""});

        } else {
          c.tabs.sendMessage(tab.id, "toggle");
        }
      });

      if (ekillSettings.holdsGrudge === "true" && !showChanges) {
        let updateKillCounter = tabId => {
          c.tabs.sendMessage(tabId, "queryKillCount", {}, response => {
            if (c.runtime.lastError) {
              console.error(c.runtime.lastError);
            } else {
              if (response === undefined || response === 0) {
                c.browserAction.setBadgeText({text: ""});
              } else {
                c.browserAction.setBadgeText({text: response.toString()});
              }
            }
          });
        }

        // Check if a kill count was set when switching to a tab, and either
        // clear the badge or re-display the count
        c.tabs.onActivated.addListener((activeInfo) => {
          updateKillCounter(activeInfo.tabId);
        });
        // This is a function that handles messages sent from the content script. 
        // It listens for two types of messages: killCountUpdated and pageLoading. 
        // When it receives a message, it calls the appropriate function to handle the message.
        let msgHandler = (message, sender, sendResponse) => {
          if (message === "killCountUpdated") {
            updateKillCounter(sender.tab.id);
          } else if (message === "pageLoading") {
            // Clear badge on page reloads
            c.browserAction.setBadgeText({text: ""});
          }
        };

        c.runtime.onMessage.addListener(msgHandler);
      }
    }
  });
})(chrome);
