/****************
       API
*****************/
let APICtrl = (function() {
  (handleError = res => {
    if (!res.ok) {
      throw new Error(`Error: ${status}`);
    }
  }),
    (getPreviewItems = (json, search) => {
      let matchedIndex = null;
      return {
        items: (mappedItems = json.common.map((item, index) => {
          obj = {
            name: item.food_name,
            imageUrl: item.photo.thumb
          };
          if (search === obj.name) {
            obj.match = true;
            matchedIndex = index;
          }
          return obj;
        })),
        index: matchedIndex
      };
    });
  return {
    async get(search) {
      let formattedSearch = search.replace(" ", "%20");
      let res = await fetch(
        `https://trackapi.nutritionix.com/v2/search/instant?query=${formattedSearch}`,
        {
          // rockstar9394@gmail.com
          headers: {
            "x-app-id": "cbd103a7",
            "x-app-key": "3c76790e5d35adc7c61ea36740c6deef"
          }
          // 94vimalpatel@gmail.com
          // headers: {
          //   "x-app-id": "7e83f2a7",
          //   "x-app-key": "40e59c40a37584e632f1e0dffc87975b"
          // }
        }
      );
      handleError(res);
      return getPreviewItems(await res.json(), search);
    }
  };
})();

/****************
     Storage
*****************/
let StorageCtrl = (function() {
  return {
    get: function() {
      let items = localStorage.getItem("foodItems");
      if (!items) {
        items = "[]";
      }
      return JSON.parse(items);
    },
    set: function(items) {
      localStorage.setItem("foodItems", JSON.stringify(items));
    }
  };
})();

/****************
      State
*****************/
let StateCtrl = (function() {
  /* Private members */
  const state = {
    items: [],
    totalCalories: 0
  };
  /* Public members */
  return {
    getState: function() {
      return state;
    },
    log: function() {
      console.log(
        JSON.stringify(
          state,
          null,
          2 //No. of whitespaces for pretty-printing
        )
      );
    },
    initState: function(items) {
      state.items = items;
      state.totalCalories = this.calcTotalCalories();
    },
    addItem: function(name, calories, imageUrl) {
      state.items.push({
        name: name,
        calories: calories,
        imageUrl: imageUrl
      });
      state.totalCalories += Number(calories);
      return { totalCalories: state.totalCalories, serial: state.items.length };
    },
    removeItem: function(index) {
      state.totalCalories -= Number(state.items[index].calories);
      state.items.splice(index, 1);
      return state.totalCalories;
    },
    calcTotalCalories: function() {
      let totalCalories = 0;
      state.items.forEach(item => {
        totalCalories += Number(item.calories);
      });
      return totalCalories;
    }
  };
})();

/****************
       UI
*****************/
let UICtrl = (function() {
  let height = "0px";
  // Private members
  hooks = {
    section: document.querySelector("section"),
    listHeadingCalories: document.querySelector("#list-heading-calories"),
    listItems: document.querySelector("#list-items"),
    mealInput: document.querySelector("#meal"),
    mealLabel: document.querySelector("label[for='meal']"),
    caloriesInput: document.querySelector("#calories"),
    caloriesLabel: document.querySelector("label[for='calories']"),
    add: document.querySelector("#add"),
    previewCards: document.querySelector("#preview-cards"),
    // For changing heading padding
    listWrapper: document.querySelector("#list-wrapper")
  };
  // Use the hamburger as placeholder image
  replacePlaceholderImage = item => {
    if (/nix-apple-grey.png$/.test(item.imageUrl)) {
      item.imageUrl = "img/burger.png";
    }
  };

  adjustForDesktop = () => {
    if (window.innerWidth >= 900) {
      hooks.previewCards.style.height = "35rem";
    }
  };
  // Public members
  return {
    paintPreview: function(previewItems) {
      let itemsHTML = "";
      previewItems.forEach(function(item) {
        replacePlaceholderImage(item);
        let selectedClass = item.match ? " selected" : "";
        // if (item.name.length > 15) {
        //   console.log(`Before: ${item.name}, length: ${item.name.length}`);
        //   item.name = item.name.substring(0, 25);
        //   console.log(`After: ${item.name}, length: ${item.name.length}`);
        // }
        itemsHTML += `
        <div class="preview-card${selectedClass}">
            <div class="preview-card-image" style="background-image: url('${item.imageUrl}')"></div>
            <div class="preview-card-meal">${item.name}</div>
        </div>`;
      });
      if (itemsHTML === "") {
        hooks.previewCards.className = "no-preview";
        hooks.previewCards.innerHTML =
          "Sorry, no matches found for the search string :(";
        hooks.previewCards.style.height = "27px";
        height = "27px";
      } else {
        hooks.previewCards.style.height = 60 + 80 * previewItems.length + "px";
        height = hooks.previewCards.style.height;
        hooks.previewCards.className = "";
        hooks.previewCards.innerHTML = "<p>Search results</p>" + itemsHTML;
      }
      adjustForDesktop();
    },
    setHeightMessage: function() {
      hooks.previewCards.style.height = "27px";
      height = "27px";
      adjustForDesktop();
    },
    setHeightZero: function() {
      hooks.previewCards.style.height = "0px";
      height = "0px";
      adjustForDesktop();
    },
    adjustHeight: function() {
      if (window.innerWidth < 900) {
        hooks.previewCards.style.height = height;
        console.log(height);
      } else {
        hooks.previewCards.style.height = "35rem";
      }
    },
    clearPreview: function() {
      hooks.previewCards.className = "no-preview";
      hooks.previewCards.innerHTML = "";
    },

    clearInputs: function() {
      hooks.mealInput.value = "";
      hooks.caloriesInput.value = "";
    },
    paintList: function(state) {
      // Total calories
      hooks.listHeadingCalories.innerHTML = `Total calories: ${state.totalCalories}`;
      // List items
      let itemsHTML = "";
      state.items.forEach(function(item, index) {
        replacePlaceholderImage(item);
        itemsHTML += `
        <div class="list-item">
            <div class="list-subitem">
                <p class="list-item-number">${index + 1}.</p>
                <div class="list-item-image" style="background-image: url('${
                  item.imageUrl
                }')"></div>
                <p class="list-item-meal">${item.name}</p>
            </div>
            <div class="list-subitem">
                <p class="list-item-calories">${item.calories}</p>
                <i class="fas fa-minus-circle"></i>
            </div>
        </div>`;
      });
      hooks.listItems.innerHTML = itemsHTML;
    },
    addItem: function(totalCalories, serial, imageUrl, name, calories) {
      let itemsHTML = `
      <div class="list-item">
          <div class="list-subitem">
              <p class="list-item-number">${serial}.</p>
              <div class="list-item-image" style="background-image: url('${imageUrl}')"></div>
              <p class="list-item-meal">${name}</p>
          </div>
          <div class="list-subitem">
              <p class="list-item-calories">${calories}</p>
              <i class="fas fa-minus-circle"></i>
          </div>
      </div>`;
      hooks.listItems.innerHTML += itemsHTML;
      hooks.listHeadingCalories.innerHTML = `Total calories: ${totalCalories}`;
    },
    removeItem(itemToRemove, totalCalories) {
      let removed = false;
      Array.from(hooks.listItems.children).forEach(function(item) {
        if (removed) {
          item.firstElementChild.firstElementChild.innerHTML =
            Number(
              item.firstElementChild.firstElementChild.innerHTML.replace(
                ".",
                ""
              )
            ) -
            1 +
            ".";
        }
        if (item === itemToRemove) {
          removed = true;
          item.remove();
        }
      });
      hooks.listHeadingCalories.innerHTML = `Total calories: ${totalCalories}`;
    },
    showError: function(err, input, label) {
      input.value = "";
      input.placeholder = err;
      input.className = "error";
      label.className = "error";
      hooks.previewCards.style.height = "0px";
      height = "0px";
      adjustForDesktop();
    },
    clearCarlorieInput: function() {
      hooks.caloriesInput.value = "";
    },
    resetErrorStyle: function(msg, input, label) {
      // Remove Error styling from input
      input.placeholder = msg;
      input.className = "";
      label.className = "";
    },

    showSuccess: function(msg) {
      hooks.previewCards.className = "preview-cards success";
      hooks.previewCards.innerHTML = msg;
    },
    showAlert: function(msg) {
      hooks.previewCards.className = "preview-cards alert";
      hooks.previewCards.innerHTML = msg;
    },
    padListHeading: function(noOfItems) {
      if (noOfItems === 0) {
        hooks.listWrapper.className = "zero-items";
      } else {
        hooks.listWrapper.className = "";
      }
    },
    getHooks: function() {
      return hooks;
    }
  };
})();

/****************
       App
*****************/
let App = (function() {
  let items = StorageCtrl.get();
  StateCtrl.initState(items);
  UICtrl.paintList(StateCtrl.getState());
  UICtrl.clearPreview();
  UICtrl.padListHeading(items.length);
  UICtrl.adjustHeight();

  /****************
       Resize
  *****************/
  window.addEventListener("resize", e => {
    UICtrl.adjustHeight();
  });

  /****************
      Meal input
  *****************/
  let selected = null;
  let hooks = UICtrl.getHooks();

  hooks.mealInput.addEventListener("keyup", e => {
    selected = null;
    let search = e.target.value;

    UICtrl.resetErrorStyle("Enter meal", hooks.mealInput, hooks.mealLabel);

    if (search === "") {
      UICtrl.clearPreview();
      UICtrl.setHeightZero();
      return;
    }

    APICtrl.get(search)
      .then(function(res) {
        UICtrl.paintPreview(res.items);
        if (res.index != null) {
          selected = document.querySelector(
            `.preview-card:nth-of-type(${res.index + 1})`
          );
        }
      })
      .catch(function(err) {
        console.log(err);
      });
  });

  /****************
    Calories input
  *****************/
  hooks.caloriesInput.addEventListener("keyup", e => {
    UICtrl.resetErrorStyle(
      "Enter calories",
      hooks.caloriesInput,
      hooks.caloriesLabel
    );
  });

  /****************
      Previews
  *****************/
  hooks.previewCards.addEventListener("click", e => {
    let ele = e.target;
    // Card or card child selected
    if (ele.id != "preview-cards") {
      // If card child, manually bubble up to the parent
      ele =
        ele.parentElement.className === "preview-card"
          ? ele.parentElement
          : ele;
      // Reset previously selected card
      if (selected) {
        selected.className = "preview-card";
      }
      // Assign currently selected card
      selected = ele;
      ele.className += " selected";
      // Set meal input
      hooks.mealInput.value = ele.lastElementChild.innerHTML;
    }
  });

  /****************
     Submit Meal
  *****************/
  hooks.add.addEventListener("click", e => {
    e.preventDefault();
    let meal = hooks.mealInput.value;
    let calories = hooks.caloriesInput.value;

    if (!meal) {
      UICtrl.clearPreview();
      UICtrl.showError(
        "Please Enter a meal first",
        hooks.mealInput,
        hooks.mealLabel
      );
      return;
    } else if (!calories) {
      UICtrl.clearPreview();
      UICtrl.showError(
        "Please enter a valid no.",
        hooks.caloriesInput,
        hooks.caloriesLabel
      );
      return;
    } else if (calories < 0) {
      UICtrl.clearPreview();
      UICtrl.clearCarlorieInput();
      UICtrl.showError(
        "Must be a postive no.",
        hooks.caloriesInput,
        hooks.caloriesLabel
      );
      return;
    }
    let imageUrl;
    if (selected) {
      imageUrl = selected.firstElementChild.style.backgroundImage
        .match(/".*"/)[0]
        .replace(/"/g, "");
    } else {
      imageUrl = "img/burger.png";
    }
    let res = StateCtrl.addItem(meal, calories, imageUrl);
    StorageCtrl.set(items);
    UICtrl.addItem(res.totalCalories, res.serial, imageUrl, meal, calories);
    UICtrl.clearInputs();
    UICtrl.clearPreview();
    UICtrl.showSuccess("You have successfully inserted a meal :)");
    UICtrl.padListHeading(items.length);
    UICtrl.setHeightMessage();
  });

  /****************
     Delete Meal
  *****************/
  hooks.listItems.addEventListener("click", function(e) {
    let ele = e.target;
    if (ele.className === "fas fa-minus-circle") {
      let item = ele.parentElement.parentElement;
      totalCalories = StateCtrl.removeItem(
        Number(
          item.firstElementChild.firstElementChild.innerHTML.replace(".", "")
        ) - 1
      );
      StorageCtrl.set(items);
      UICtrl.removeItem(item, totalCalories);
      UICtrl.showAlert("You have successfully removed a meal :)");
      UICtrl.padListHeading(items.length);
      UICtrl.setHeightMessage();
    }
  });
})();
