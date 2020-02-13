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
          console.log(typeof search, typeof obj.name);
          if (search === obj.name) {
            obj.match = true;
            matchedIndex = index;
            console.log("Matched Index, Mate!", index);
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
  // Private members
  hooks = {
    section: document.querySelector("section"),
    listHeadingCalories: document.querySelector("#list-heading-calories"),
    listItems: document.querySelector("#list-items"),
    mealInput: document.querySelector("#meal"),
    caloriesInput: document.querySelector("#calories"),
    add: document.querySelector("#add"),
    previewCards: document.querySelector("#preview-cards")
  };
  // Use the hamburger as placeholder image
  replacePlaceholderImage = item => {
    if (/nix-apple-grey.png$/.test(item.imageUrl)) {
      item.imageUrl = "img/burger.png";
    }
  };
  // Public members
  return {
    paintPreview: function(previewItems) {
      let itemsHTML = "";
      previewItems.forEach(function(item) {
        replacePlaceholderImage(item);
        let selectedClass = item.match ? " selected" : "";
        itemsHTML += `
        <div class="preview-card${selectedClass}">
            <div class="preview-card-image" style="background-image: url('${item.imageUrl}')"></div>
            <div class="preview-card-meal">${item.name}</div>
        </div>`;
      });
      hooks.previewCards.innerHTML = itemsHTML;
      if (itemsHTML === "") {
        console.log("Empty Search: Applying Style");
        hooks.previewCards.className = "preview-cards no-preview";
        hooks.previewCards.innerHTML =
          "Sorry, no matches found for the search string :(";
        console.log(previewItems);
      } else {
        hooks.previewCards.className = "";
        console.log("1+ Searches: Applying Style");
        hooks.previewCards.innerHTML = "<p>Search results</p>" + itemsHTML;
      }
    },
    clearPreview: function() {
      hooks.previewCards.className = "preview-cards no-preview";
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

  /****************
      Meal input
  *****************/
  let selected = null;
  let hooks = UICtrl.getHooks();
  hooks.mealInput.addEventListener("keyup", e => {
    selected = null;
    let search = e.target.value;
    if (search === "") {
      UICtrl.clearPreview();
      return;
    }
    APICtrl.get(search)
      .then(function(res) {
        console.log(res);
        UICtrl.paintPreview(res.items);
        if (res.index != null) {
          selected = document.querySelector(
            `.preview-card:nth-of-type(${res.index + 1})`
          );
          console.log(selected);
        }
      })
      .catch(function(err) {
        console.log(err);
      });
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
    console.log(selected);
    e.preventDefault();
    let meal = hooks.mealInput.value;
    let calories = hooks.caloriesInput.value;
    if (!meal || !calories) {
      UICtrl.clearPreview();
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
    }
  });
})();
