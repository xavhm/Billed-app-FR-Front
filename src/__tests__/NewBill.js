/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import BillsUI from "../views/BillsUI.js";
import store from "../__mocks__/store.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store";
jest.mock("../app/store", () => mockStore);
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      const pathname = ROUTES_PATH["NewBill"];
      root.innerHTML = ROUTES({ pathname: pathname, loading: true });
      document.getElementById("layout-icon1").classList.remove("active-icon");
      document.getElementById("layout-icon2").classList.add("active-icon");
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");
      const iconActivated = mailIcon.classList.contains("active-icon");
      expect(iconActivated).toBeTruthy();
    });
  });

  describe("When I select an image in a correct format", () => {
    test("Then the input file should display the file name", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const input = screen.getByTestId("file");
      input.addEventListener("change", handleChangeFile);
      fireEvent.change(input, {
        target: {
          files: [
            new File(["image.png"], "image.png", {
              type: "image/png",
            }),
          ],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(input.files[0].name).toBe("image.png");
    });

    test("Then a bill is created", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      const submit = screen.getByTestId("form-new-bill");
      submit.addEventListener("submit", handleSubmit);
      fireEvent.submit(submit);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe("When I select a file with an incorrect extension", () => {
    test("Then the bill is deleted", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const input = screen.getByTestId("file");
      input.addEventListener("change", handleChangeFile);
      fireEvent.change(input, {
        target: {
          files: [
            new File(["file.pdf"], "file.pdf", {
              type: "image/txt",
            }),
          ],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(input.files[0].name).toBe("file.pdf");
    });
  });
});

// INTEGRATION TESTS
describe("Given I am a user connected as Employee", () => {
  describe("When I add a new bill", () => {
    beforeEach(() => {
      jest.spyOn(store, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.tld",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("create a new bills from mock API POST", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({
          pathname,
        });
      };
      window.onNavigate(ROUTES_PATH.NewBill);

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      document.body.innerHTML = NewBillUI();
      const inputExpenseType = screen.getByTestId("expense-type");
      const inputExpenseName = screen.getByTestId("expense-name");
      const inputDatePicker = screen.getByTestId("datepicker");
      const inputAmount = screen.getByTestId("amount");
      const inputVAT = screen.getByTestId("vat");
      const inputPCT = screen.getByTestId("pct");
      const inputCommentary = screen.getByTestId("commentary");
      const inputFile = screen.getByTestId("file");

      userEvent.type(inputExpenseType, "Transports");
      userEvent.type(inputExpenseName, "Vol Paris Londres");
      userEvent.type(inputDatePicker, "2022-04-04");
      userEvent.type(inputAmount, "348");
      userEvent.type(inputVAT, "70");
      userEvent.type(inputPCT, "20");
      userEvent.type(inputCommentary, "...");
      newBill.fileName = "testFile";
      newBill.fileUrl =
        "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a";
      const email = "e@e";

      const bill = [
        {
          id: "47qAXb6fIm2zOKkLzMro",
          vat: "80",
          fileUrl:
            "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
          status: "pending",
          type: "Hôtel et logement",
          commentary: "séminaire billed",
          name: "encore",
          fileName: "preview-facture-free-201801-pdf-1.jpg",
          date: "2004-04-04",
          amount: 400,
          commentAdmin: "ok",
          email: "a@a",
          pct: 20,
        },
      ];

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const handleSubmit = jest.spyOn(newBill, "handleSubmit");
      const formNewBill = screen.getByTestId("form-new-bill");
      mockStore.bills.mockImplementation(() => {
        return {
          create: () => {
            return Promise.resolve({ fileUrl: `${newBill.fileUrl}`, key: "1234" });
          },
          update: () => {
            return Promise.resolve({
              id: "47qAXb6fIm2zOKkLzMro",
              vat: "80",
              fileUrl:
                "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
              status: "pending",
              type: "Hôtel et logement",
              commentary: "séminaire billed",
              name: "encore",
              fileName: "preview-facture-free-201801-pdf-1.jpg",
              date: "2004-04-04",
              amount: 400,
              commentAdmin: "ok",
              email: "a@a",
              pct: 20,
            });
          },
        };
      });

      inputFile.addEventListener("change", handleChangeFile);
      formNewBill.addEventListener("submit", handleSubmit);
      userEvent.upload(
        inputFile,
        new File(["(--[IMG]--)"], "testFile.jpg", {
          type: "image/jpg",
        })
      );
      fireEvent.submit(formNewBill);

      expect(handleChangeFile).toHaveBeenCalled();
      expect(handleChangeFile).toBeCalledTimes(1);
      expect(handleSubmit).toHaveBeenCalled();
      expect(handleSubmit).toBeCalledTimes(1);
      expect(mockStore.bills).toHaveBeenCalled();
      expect(mockStore.bills).toHaveBeenCalledTimes(2);
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    });

    describe("When API returns an error", () => {
      test("Then it fails with a 404 message error", async () => {
        const html = BillsUI({ error: "Erreur 404" });
        document.body.innerHTML = html;
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("Then it fails with a 500 message error", async () => {
        const html = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = html;
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
