<template>
  <div class="wrap pa-0 d-flex flex-column justify-space-between">
    <div>
      <signed-in-header></signed-in-header>
      <div class="text-left px-2 d-flex justify-space-between align-center" style="background-color: #2a2a2a">
        <v-btn icon dark large @click="$router.replace({'name':'index'})"><v-icon color="grey">mdi-arrow-left</v-icon></v-btn>
        <strong style="font-weight:600">NCG {{t('transfer')}}</strong>
        <v-btn icon dark large disabled></v-btn>
      </div>

      <div class="mt-10">
        <v-form ref="sendForm">
        <v-row class="px-6">
          <v-col cols="4" class="pb-0 text-left">{{t('sender')}}</v-col>
          <v-col class="py-0 text-left">
            <div class="box">
              <account-selector :accounts="accounts" :account="account" only-select></account-selector>
              <div class="grey--text hex ml-2">{{shortAddress(account.address)}}</div>
            </div>
          </v-col>
        </v-row>
        <v-row class="px-6 mt-9">
          <v-col cols="4" class="pb-0 text-left">{{t('receiver')}}</v-col>
          <v-col class="py-0">
            <v-text-field :rules="receiverRule" validate-on-blur tabindex="1" color="grey" style="color: grey" outlined dark dense v-model="receiver"></v-text-field>
          </v-col>
        </v-row>
        <v-row class="px-6">
          <v-col cols="4" class="pb-0 text-left">{{t('balance')}}</v-col>
          <v-col class="py-0 text-left">
            <v-text-field color="grey" style="color: grey" outlined dark dense readonly :placeholder="ncgBalancePlaceholder" :loading="balanceLoading">
              <template v-slot:append><span class="mt-1">NCG</span></template>
            </v-text-field>
          </v-col>
        </v-row>
        <v-row class="px-6">
          <v-col cols="4" class="pb-0 text-left">{{t('amount')}}</v-col>
          <v-col class="py-0">
            <v-text-field :rules="amountRule" validate-on-blur tabindex="2" color="grey" placeholder="0" style="color: grey" outlined dark dense v-model="amount">
              <template v-slot:append><span class="mt-1">NCG</span></template>
            </v-text-field>
          </v-col>
        </v-row>
        </v-form>
      </div>
    </div>
    <div class="pb-10 px-8">
      <div class="d-flex">
        <v-btn dark x-large
               class="flex-fill point-btn confirm-btn"
               color="pointyellow"
               tabindex="3"
               :disabled="!isValidInput"
               @click="confirmSend"
        >{{t('next')}}</v-btn>
      </div>
    </div>

    <v-dialog dark v-model="confirmDialog" fullscreen>
      <v-card>
        <v-card-title class="py-8">NCG {{t('transfer')}}</v-card-title>
        <v-card-text class="mt-4">
          <v-row>
            <v-col class="text-left py-1">
              <v-chip small color="#444" label>{{t('sender')}} : {{account.name}}</v-chip>
              <div class="hex pl-2 mt-1">
                {{account.address}} <copy-btn style="margin-left:-8px;" :text="account.address" icon x-small><v-icon x-small color="grey">mdi-content-copy</v-icon></copy-btn>
              </div>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="text-left py-1">
              <v-chip small color="#444" label>{{t('receiver')}}</v-chip>
              <div class="hex pl-2 mt-1">
                {{receiver}} <copy-btn style="margin-left:-8px;" :text="receiver" icon x-small><v-icon x-small color="grey">mdi-content-copy</v-icon></copy-btn>
              </div>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="text-left py-1">
              <v-chip small color="#444" label>{{t('amount')}}</v-chip>
              <div class="hex pl-2 mt-1">
                {{amount}} NCG
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions class="mt-8 px-8 fixed-bottom">
          <v-btn color="secondary" class="flex-fill" @click="confirmDialog = false" :disabled="loading">{{t('cancel')}}</v-btn>
          <v-btn color="pointyellow" class="point-btn flex-fill send-btn" @click="sendPNG" :loading="loading">{{t('transfer')}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import SignedInHeader from "@/components/SignedInHeader";
import AccountManager from "@/components/AccountManager";
import {mapGetters} from "vuex";
import AccountSelector from "@/components/buttons/AccountSelector";
import rule from "@/utils/rules"
import CopyBtn from "@/components/buttons/CopyBtn";
import bg from "@/api/background"
import _ from "underscore"

export default {
    name: 'Send',
    components: {
        CopyBtn,
        AccountSelector,
        AccountManager,
        SignedInHeader
    },
    computed: {
        ...mapGetters('Account', ['accounts', 'account', 'balance', 'balanceLoading']),
        isValidInput() {
            return this.receiver && this.amount > 0
        },
        amountRule() {
            return [rule.required, rule.canNotZero, rule.ncgAmount, (v) => (Number(v) <= Number(this.balance) || 'Exceeded balance')]
        },
        receiverRule() {
            return [rule.required, rule.address]
        },
        ncgBalancePlaceholder() {
            return String(!this.balanceLoading && this.balance || '')
        }

    },
    data() {
        return {
            receiver: '',
            amount: 0,
            nonce: 0,
            signature: '',
            loading: false,
            confirmDialog: false
        }
    },
    async created() {
        this.$store.dispatch('Account/refreshBalance')
    },
    methods: {
        async confirmSend() {
            if (this.$refs['sendForm'].validate()) {
                this.nonce = await bg.wallet.nextNonce()
                this.confirmDialog = true
            }
        },
        async sendPNG() {
            this.loading = true
            let tx = await bg.wallet.sendPNG(this.account.address, this.receiver, this.amount, this.nonce)
            await this.$store.dispatch('Account/loadTxs')
            this.loading = false
            this.$router.replace({name: 'index'})
        }
    }
}
</script>

<style scoped lang="scss">
.box {
  border: 1px solid #555;
  padding: 4px 0px;
  border-radius: 4px;
}
::v-deep .v-input {
  input {
    font-size: 14px !important;
    color: #eee;
    font-family: "Roboto mono", Helvetica, Arial, sans-serif;
  }
}

</style>
