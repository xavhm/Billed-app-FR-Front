/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI, { rows } from "../views/BillsUI.js";
import NewBillUI from "../views/NewBillUI";
import Bills from "../containers/Bills";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  describe("When I am on Bills page but it is loading", () => {
    test("Then, Loading page should be rendered", () => {
      document.body.innerHTML = BillsUI({ loading: true });
      expect(screen.getAllByText("Loading...")).toBeTruthy();
    });
  });

  describe("When I am on Bills page but back-end send an error message", () => {
    test("Then, Error page should be rendered", () => {
      document.body.innerHTML = BillsUI({ error: "some error message" });
      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  });

  describe("When I am on Bills page and I click on new bill button", () => {
    test("Then, a new bill form should be opened", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const bill = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      document.body.innerHTML = NewBillUI({ data: { bills } });

      const handleClickNewBill1 = jest.fn((e) => bill.handleClickNewBill());
      const buttonNewBill = document.querySelectorAll('[data-testid="btn-new-bill"]');

      if (buttonNewBill)
        buttonNewBill.forEach((button) => {
          button.addEventListener("click", () => this.handleClickNewBill1);
          userEvent.click(buttonNewBill);
          expect(handleClickNewBill1).toHaveBeenCalled();
          expect(screen.getByTestId("form-new-bill")).toBeTruthy();
        });
    });
  });

  describe("When I am on Bills and there are no bills", () => {
    test("Then, no cards should be shown", () => {
      document.body.innerHTML = rows([]);
      const billsBody = screen.queryByTestId("tbody");
      expect(billsBody).toBeNull();
    });
  });

  describe("When I am on Bills and I click on the icon eye", () => {
    test("A modal should open", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = BillsUI(bills[0]);
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const bill = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      document.body.innerHTML = NewBillUI({ data: { bills } });

      const handleClickIconEye1 = jest.fn((e) => bill.handleClickIconEye(e, icon));

      const iconEye1 = document.querySelectorAll(`div[data-testid="icon-eye"]`);
      if (iconEye1)
        iconEye1.forEach((icon) => {
          icon.addEventListener("click", () => this.handleClickIconEye1);
          userEvent.click(iconEye1);
          expect(handleClickIconEye1).toHaveBeenCalled();
          const modale = screen.getByTestId("modal-content");
          expect(modale).toBeTruthy();
        });
    });
  });
});

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const type = await waitFor(() => screen.getByText("Type"));
      expect(type).toBeTruthy();
      const nom = await screen.getByText("Nom");
      expect(nom).toBeTruthy();
      expect(await screen.getByTestId("billDate")).toBeTruthy();
      const montant = await screen.getByText("Montant");
      expect(montant).toBeTruthy();
      const statut = await screen.getByText("Statut");
      expect(statut).toBeTruthy();
      const actions = await screen.getByText("Actions");
      expect(actions).toBeTruthy();
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 404")),
        }));
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 500")),
        }));

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
